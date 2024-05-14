const puppeteer = require('puppeteer')
const cheerio = require('cheerio')
const axios = require('axios').default
const { createWriteStream } = require('fs')
const fs = require('fs').promises
const util = require('util')
const path = require('path')

const appendFile = util.promisify(fs.appendFile)
const typeToDir = {
  css: 'css',
  js: 'js',
  png: 'img',
  jpg: 'img',
  jpeg: 'img',
  gif: 'img',
  svg: 'img',
  ico: 'img',
  woff: 'font',
  woff2: 'font',
  ttf: 'font',
  otf: 'font',
  eot: 'font',
  mp4: 'video',
  webm: 'video',
  mp3: 'audio',
  wav: 'audio',
  ogg: 'audio',
  flac: 'audio',
  aac: 'audio',
  pdf: 'pdf',
  doc: 'doc',
  docx: 'doc',
  xls: 'xls',
  xlsx: 'xls',
  ppt: 'ppt',
  pptx: 'ppt'
}

// 错误日志
async function errorLog(path: string, errorMsg: string) {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] ${errorMsg}\n`
  try {
    await appendFile(path, logMessage)
  } catch (error) {
    await appendFile(path, logMessage)
  }
}

async function downloadResource(url: string, savePath: string, errorPath: string) {
  return new Promise(async (resolve) => {
    try {
      const response = await axios.get(url, { responseType: 'stream' })
      await fs.mkdir(path.dirname(savePath), { recursive: true })
      if (response.status !== 200) {
        throw new Error(`下载失败，状态码：${response.status}`)
      }

      const writeStream = createWriteStream(savePath) // 创建一个可写流
      response.data.pipe(writeStream) // 将响应流连接到写入流

      writeStream.on('finish', () => {
        // console.log(`写入成功：${savePath}`);
        resolve({ message: '写入成功' })
      })

      response.data.on('error', async (err: any) => {
        errorLog(path.join(errorPath, 'error.txt'), `axios下载失败: ${err.message}`)
        resolve({ message: 'axios下载失败' })
      })

      writeStream.on('error', (err: any) => {
        errorLog(path.join(errorPath, 'error.txt'), `写入失败: ${err.message}`)
        resolve({ message: '写入失败' })
      })
    } catch (error: any) {
      errorLog(
        path.join(errorPath, 'error.txt'),
        `downloadResource 下载文件时出错: ${error.message}`
      )
      resolve({ message: 'downloadResource下载出错' })
    }
  })
}

async function getResource(page: any) {
  const { resources, allBg } = await page.evaluate(() => {
    /** 注意：这里只能使用浏览器api, 不能使用nodejs的api */
    // 获取页面上的所有资源链接
    const links = Array.from(
      document.querySelectorAll('link[rel=stylesheet], script[src], img[src]')
    )
    const resources = links.map((link: any) => link.href || link.src)
    // 获取页面上的所有CSS规则
    const stylesheets = Array.from(document.styleSheets)
    const cssRules = stylesheets.reduce((acc: any[], sheet) => {
      try {
        const rules = sheet.cssRules || []
        acc.push(...rules)
      } catch (e) {}
      return acc
    }, [])
    // 遍历CSS规则，查找背景图片Url
    const allBg: string[] = []
    for (const rule of cssRules) {
      if (rule.style && rule.style.backgroundImage) {
        const urlMatch = rule.style.backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/)
        if (urlMatch && urlMatch[1]) {
          const imageUrl = urlMatch[1].trim()
          allBg.push(imageUrl)
        }
      }
    }
    return { resources, allBg }
  })

  // 收集css,js,img
  const allCss: string[] = []
  const allJs: string[] = []
  const allImg: string[] = []
  for (const resource of resources) {
    const fileName = path.basename(resource)
    const fileType = path.extname(fileName).replace('.', '')
    if (typeToDir[fileType] === 'css') {
      allCss.push(resource)
    } else if (typeToDir[fileType] === 'js') {
      allJs.push(resource)
    } else if (typeToDir[fileType] === 'img') {
      allImg.push(resource)
    }
  }
  return { allCss, allJs, allImg, allBg }
}

class Site {
  page: any
  url: string
  savePath: string
  saveDir: string
  allCss: string[]
  css_index: number
  allJs: string[]
  js_index: number
  allImg: string[]
  img_index: number
  allBg: string[]
  bg_index: number
  isPause: boolean
  eventMap: Map<string, any[]>
  constructor(options) {
    this.page = options.page
    this.url = options.url
    this.savePath = options.savePath
    this.saveDir = ''
    this.allCss = []
    this.css_index = 0
    this.allJs = []
    this.js_index = 0
    this.allImg = []
    this.img_index = 0
    this.allBg = []
    this.bg_index = 0
    this.isPause = false // 暂停
    this.eventMap = new Map()
    this.init()
  }

  async init() {
    try {
      // 保存HTML
      let htmlContent = await this.page.content()
      htmlContent = this.modifyExternalLinks(htmlContent)
      const dir = this.url.split('//')[1].split('.')[0]
      this.saveDir = path.join(this.savePath, dir)
      await fs.mkdir(this.saveDir, { recursive: true })
      await fs.writeFile(path.join(this.saveDir, 'index.html'), htmlContent, 'utf8')
      // await page.screenshot({ path: path.join(saveDir, "index.png"), fullPage: true });

      // 获取页面资源
      const { allCss, allJs, allImg, allBg } = await getResource(this.page)
      this.allCss = allCss
      this.allJs = allJs
      this.allImg = allImg
      this.allBg = allBg

      // 下载资源
      this.download('css')
      this.download('js')
      this.download('img')
      this.download('bg')
    } catch (error) {
      console.log(error)
    }
  }

  start() {
    this.isPause = false
    this.download('css')
    this.download('js')
    this.download('img')
    this.download('bg')
  }

  pause() {
    this.isPause = true
  }

  on(event, callback) {
    if (!this.eventMap.has(event)) {
      this.eventMap.set(event, [callback])
    } else {
      this.eventMap.get(event)!.push(callback)
    }
  }

  private async download(type: 'css' | 'js' | 'img' | 'bg') {
    const startMap = {
      css: {
        prop: 'allCss',
        index: 'css_index'
      },
      js: {
        prop: 'allJs',
        index: 'js_index'
      },
      img: {
        prop: 'allImg',
        index: 'img_index'
      },
      bg: {
        prop: 'allBg',
        index: 'bg_index'
      }
    }
    const { prop, index } = startMap[type]
    const allResource = this[prop]
    const resource_index = this[index]
    if (resource_index >= allResource.length || this.isPause) return

    const url = allResource[resource_index]
    const savePath = path.join(this.saveDir, 'static', type, path.basename(url))
    await downloadResource(url, savePath, this.savePath)
    // console.log(`${css}下载完成 存放到${this.savePath}`);
    if (this.eventMap.has('progress')) {
      let progress = Math.round((resource_index / allResource.length) * 100)
      let type_progress = `${this.url}_${type}`
      if (type === 'bg' || type === 'img') {
        progress = Math.round(
          ((this.img_index + this.bg_index) / (this.allImg.length + this.allImg.length)) * 100
        )
        type_progress = `${this.url}_img`
      }
      const progressInfo = {
        progress,
        type: type_progress,
        current: resource_index,
        total: allResource.length
      }
      this.eventMap.get('progress')!.forEach((event) => event(progressInfo))
    }
    this[index]++
    if (
      this.css_index === this.allCss.length &&
      this.js_index === this.allJs.length &&
      this.img_index === this.allImg.length &&
      this.bg_index === this.allBg.length
    ) {
      // 爬取完成
      if (this.eventMap.has('finish')) {
        this.eventMap.get('finish')!.forEach((event) => event(this.url))
      }
    }
    this.download(type)
  }

  // 修改外部链接
  private modifyExternalLinks(html) {
    const $ = cheerio.load(html)
    const sourceMap = [
      {
        selector: 'link[href]',
        dir: 'css'
      },
      {
        selector: 'img[src]',
        dir: 'img'
      },
      {
        selector: 'script[src]',
        dir: 'js'
      }
    ]
    sourceMap.forEach(({ selector, dir }) => {
      $(selector).each((_, element) => {
        const attrName = selector.split('[')[1].replace(']', '')
        const attrValue = $(element).attr(attrName)
        const fileName = path.basename(attrValue)

        const newUrl = `./static/${dir}/${fileName}`
        $(element).attr(attrName, newUrl)
      })
    })

    return $.html()
  }
}

export default class Spider {
  urls: string[]
  finish_num: number
  savePath: string
  headless: boolean
  siteMap: Map<string, Site>
  eventMap: Map<string, any[]>
  constructor(options) {
    this.urls = options.urls
    this.finish_num = 0
    this.savePath = options.savePath
    this.headless = options.headless
    this.siteMap = new Map()
    this.eventMap = new Map()
    this.init()
  }

  async init() {
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: this.headless
    })

    this.urls.forEach(async (url) => {
      try {
        const page = await browser.newPage()
        await page.goto(url, { waitUntil: 'networkidle2' })
        const site = new Site({
          page,
          url,
          savePath: this.savePath
        })
        site.on('progress', (progressInfo) => {
          if (this.eventMap.has('progress')) {
            this.eventMap.get('progress')!.forEach((event) => event(progressInfo))
          }
        })
        site.on('finish', (finish_url) => {
          this.finish_num++
          if (this.eventMap.has('finish')) {
            this.eventMap
              .get('finish')!
              .forEach((event) => event({ type: 'single', status: true, url: finish_url }))
          }
          if (this.finish_num === this.urls.length) {
            // 爬虫结束
            browser.close()
            if (this.eventMap.has('finish')) {
              this.eventMap.get('finish')!.forEach((event) => event({ type: 'all', status: true }))
            }
          }
        })
        this.siteMap.set(url, site)
      } catch (error) {
        this.finish_num++
        if (this.eventMap.has('finish')) {
          this.eventMap
            .get('finish')!
            .forEach((event) => event({ type: 'single', status: false, url }))
        }
        if (this.finish_num === this.urls.length) {
          // 爬虫结束
          browser.close()
          if (this.eventMap.has('finish')) {
            this.eventMap.get('finish')!.forEach((event) => event({ type: 'all', status: true }))
          }
        }
      }
    })
  }

  pause(url) {
    this.siteMap.get(url) && this.siteMap.get(url)!.pause()
  }

  start(url) {
    this.siteMap.get(url) && this.siteMap.get(url)!.start()
  }

  on(event, callback) {
    if (!this.eventMap.has(event)) {
      this.eventMap.set(event, [callback])
    } else {
      this.eventMap.get(event)!.push(callback)
    }
  }
}
