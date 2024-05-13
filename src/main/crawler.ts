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

export interface ICrawlerOptions {
  urls: string[]
  root: string
  headless: boolean
}
export default class Crawler {
  private options: ICrawlerOptions
  constructor(options: ICrawlerOptions) {
    this.options = options
  }
  // 错误日志
  async errorLog(path: string, errorMsg: string) {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] ${errorMsg}\n`
    try {
      await appendFile(path, logMessage)
    } catch (error) {
      await appendFile(path, logMessage)
    }
  }

  // 下载资源
  async downloadResource(url: string, savePath: string) {
    try {
      const response = await axios.get(url, { responseType: 'stream' })
      await fs.mkdir(path.dirname(savePath), { recursive: true })
      if (response.status !== 200) {
        throw new Error(`下载失败，状态码：${response.status}`)
      }
      const writeStream = createWriteStream(savePath) // 创建一个可写流
      response.data.pipe(writeStream) // 将响应流连接到写入流

      response.data.on('error', async (err: any) => {
        this.errorLog(path.join(this.options.root, 'error.txt'), `axios下载失败: ${err.message}`)
      })

      writeStream.on('finish', () => {
        // console.log(`写入成功：${savePath}`);
      })

      writeStream.on('error', (err: any) => {
        this.errorLog(path.join(this.options.root, 'error.txt'), `写入失败: ${err.message}`)
      })
    } catch (error: any) {
      this.errorLog(
        path.join(this.options.root, 'error.txt'),
        `downloadResource 下载文件时出错: ${error.message}`
      )
    }
  }

  async savePageResources(page: any, saveDir: string, weburl: string) {
    const { resources, bgcUrls }: { resources: string[]; bgcUrls: string[] } = await page.evaluate(
      () => {
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
        const bgcUrls: string[] = []
        for (const rule of cssRules) {
          if (rule.style && rule.style.backgroundImage) {
            const urlMatch = rule.style.backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/)
            if (urlMatch && urlMatch[1]) {
              const imageUrl = urlMatch[1].trim()
              bgcUrls.push(imageUrl)
            }
          }
        }

        return { resources, bgcUrls }
      }
    )

    // css背景图片
    bgcUrls.forEach(async (bgcUrl) => {
      const url = path.join(weburl, bgcUrl.replace('..', '')).replace(/\\/g, '/')
      const fileName = path.basename(url)
      const savePath = path.join(saveDir, 'static/image')
      try {
        const response = await axios.get(url, { responseType: 'arraybuffer' })
        const buffer = Buffer.from(response.data, 'binary')
        await fs.mkdir(savePath, { recursive: true })
        await fs.writeFile(`${savePath}/${fileName}`, buffer, 'binary')
      } catch (error: any) {
        this.errorLog(
          path.join(this.options.root, 'error.txt'),
          `下载背景图片失败: ${bgcUrl} ${error.message}`
        )
      }
    })

    // 下载外部资源
    for (const resource of resources) {
      const fileName = path.basename(resource)
      const fileType = path.extname(fileName).replace('.', '')
      const savePath = path.join(
        saveDir,
        'static',
        typeToDir[fileType] || '',
        path.basename(resource)
      )

      await this.downloadResource(resource, savePath)
    }
  }

  // 修改外部链接
  modifyExternalLinks(html) {
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
      $(selector).each((index, element) => {
        const attrName = selector.split('[')[1].replace(']', '')
        const attrValue = $(element).attr(attrName)
        const fileName = path.basename(attrValue)

        const newUrl = `./static/${dir}/${fileName}`
        $(element).attr(attrName, newUrl)
      })
    })

    return $.html()
  }

  async getPage(browser: any, url: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const page = await browser.newPage()
        await page.goto(url, { waitUntil: 'networkidle2' })
        const dir = url.split('//')[1].split('.')[0]
        // 保存HTML
        let htmlContent = await page.content()
        htmlContent = this.modifyExternalLinks(htmlContent)
        const saveDir = path.join(this.options.root, dir)
        await fs.mkdir(saveDir, { recursive: true })
        await fs.writeFile(path.join(saveDir, 'index.html'), htmlContent, 'utf8')
        // await page.screenshot({ path: path.join(saveDir, "index.png"), fullPage: true });

        // 保存资源
        await this.savePageResources(page, saveDir, url)
        console.log(`爬取页面成功: ${url}`)
        resolve(true)
      } catch (error) {
        console.log(`爬取页面失败: ${url}`, error)
        reject(error)
      }
    })
  }

  async getPages() {
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: this.options.headless
    })
    const actions: Promise<any>[] = []
    this.options.urls.forEach(async (url) => {
      actions.push(this.getPage(browser, url))
    })
    await Promise.all(actions)

    await browser.close()
  }
}
