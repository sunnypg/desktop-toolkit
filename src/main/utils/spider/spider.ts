const puppeteer = require('puppeteer')
const cheerio = require('cheerio')
const axios = require('axios').default
const { createWriteStream } = require('fs')
const fs = require('fs').promises
const path = require('path')
import { IProgress } from '../../../types/spider.type'
import Logger from './logger'

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
let logger: any = null
async function downloadResource(
  url: string,
  savePath: string,
  errorPath: string
): Promise<{ status: string; message: string }> {
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
        resolve({ status: 'success', message: '写入成功' })
      })

      errorPath = path.join(errorPath, 'error.txt')
      response.data.on('error', async (err: any) => {
        logger.error(url, 'axios下载过程失败', err)
        resolve({ status: 'fail', message: 'axios下载过程失败' })
      })

      writeStream.on('error', (err: any) => {
        logger.error(url, '写入失败', err)
        resolve({ status: 'fail', message: '写入失败' })
      })
    } catch (err: any) {
      logger.error(url, 'downloadResource下载文件失败', err)
      resolve({ status: 'fail', message: 'downloadResource 下载文件失败' })
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

function joinPath(baseUrl: string, relativePath: string) {
  return new URL(path.join(baseUrl, relativePath)).href
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
      const dir = new URL(this.url).hostname
      this.saveDir = path.join(this.savePath, dir)
      await fs.mkdir(this.saveDir, { recursive: true })
      await fs.writeFile(path.join(this.saveDir, 'index.html'), htmlContent, 'utf8')
      // await page.screenshot({ path: path.join(saveDir, "index.png"), fullPage: true });

      // 获取页面资源
      const { allCss, allJs, allImg, allBg } = await getResource(this.page)
      this.allCss = allCss
      this.allJs = allJs
      this.allImg = allImg
      this.allBg = allBg.map((bgUrl) => {
        if (!bgUrl.startsWith('http')) {
          bgUrl = joinPath(this.url, bgUrl.replace('../', ''))
        }
        return bgUrl
      })

      this.dispatch('resource')

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
    const savePath = path.join(
      this.saveDir,
      'static',
      type === 'bg' ? 'image' : type,
      path.basename(url)
    )
    const res = await downloadResource(url, savePath, this.savePath)
    this[index]++
    this.dispatch('progress', (): IProgress => {
      let current = resource_index
      let total = allResource.length
      let type_progress = `${this.url}_${type}`
      if (type === 'bg' || type === 'img') {
        current = this.img_index + this.bg_index
        total = this.allImg.length + this.allBg.length
        type_progress = `${this.url}_img`
      }
      let progress = Math.round((current / total) * 100)
      return {
        status: res.status,
        message: res.message,
        progress,
        type_progress,
        type,
        current,
        total
      }
    })
    // 爬取完成
    if (this.isFinished()) {
      this.dispatch('finish', this.url)
    }
    this.download(type)
  }

  private dispatch(name: string, arg?: string | object | Function) {
    if (this.eventMap.has(name)) {
      if (typeof arg === 'function') arg = arg()
      this.eventMap.get(name)!.forEach((event) => event(arg))
    }
  }

  private isFinished() {
    return (
      this.css_index === this.allCss.length &&
      this.js_index === this.allJs.length &&
      this.img_index === this.allImg.length &&
      this.bg_index === this.allBg.length
    )
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
  resource_num: number
  savePath: string
  headless: boolean
  siteMap: Map<string, Site>
  eventMap: Map<string, any[]>
  constructor(options) {
    this.urls = options.urls
    this.finish_num = 0
    this.resource_num = 0
    this.savePath = options.savePath
    this.headless = options.headless
    this.siteMap = new Map()
    this.eventMap = new Map()
    this.init()
    logger = new Logger({ savePath: `${this.savePath}/error.log` })
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
        // 监听资源情况
        site.on('resource', () => {
          this.resource_num++
          if (this.resource_num >= this.urls.length) browser.close() // 资源获取完毕，关闭浏览器
        })
        // 监听进度
        site.on('progress', (progressInfo) => {
          this.dispatch('progress', progressInfo)
        })
        // 监听完成
        site.on('finish', (finish_url) => {
          this.finish_num++
          this.dispatch('finish', { type: 'single', status: 'success', url: finish_url })
          if (this.finish_num >= this.urls.length) {
            this.dispatch('finish', { type: 'all', status: 'success', url: null }) // 爬虫结束
          }
        })
        this.siteMap.set(url, site)
      } catch (error) {
        this.finish_num++
        this.dispatch('finish', { type: 'single', status: 'fail', url })
        if (this.finish_num >= this.urls.length) {
          this.dispatch('finish', { type: 'all', status: 'success', url: null }) // 爬虫结束
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

  private dispatch(name: string, arg: string | object | Function) {
    if (this.eventMap.has(name)) {
      if (typeof arg === 'function') arg = arg()
      this.eventMap.get(name)!.forEach((event) => event(arg))
    }
  }
}
