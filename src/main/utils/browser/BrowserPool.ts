const puppeteer = require('puppeteer')
import { IBrowser } from '../../../types/browser.type'
import fakeFingerPrint from './fakeFingerPrint'
import setBookmarks from './setBookmarks'

export default class BrowserPool {
  private browsers: Map<string, any>
  private eventMap: Map<string, any[]>
  private browsers_urls: Map<string, any[]>
  constructor() {
    this.browsers = new Map()
    this.eventMap = new Map()
    this.browsers_urls = new Map()
  }

  async open(options: IBrowser) {
    return new Promise<any>(async (resolve, reject) => {
      try {
        const browser = await puppeteer.launch({
          headless: false,
          defaultViewport: null,
          args: [
            `--user-agent=${options.userAgent}`,
            `--proxy-server=${options.proxyUrl}`,
            ...(options.disable_webgl
              ? [
                  '--disable-webgl',
                  '--disable-3d-apis',
                  '--disable-webgl-image-chromium',
                  '--disable-webgl2'
                ]
              : []),
            `--webgl-antialiasing-mode=${options.webgl_mode || 'none'}`
          ],
          ignoreDefaultArgs: ['about:blank'],
          userDataDir: options.userDataDir
        })

        browser.on('targetcreated', async (target) => {
          if (target.type() === 'page') {
            const newPage = await target.page()
            this.onPageChange(options.id, browser, newPage)
          }
        })

        this.browsers.set(options.id, browser)
        this.browsers_urls.set(options.id, options.urls)
        resolve(browser)
        browser.on('disconnected', async () => {
          const urls = this.urls(options.id)!
            .map((page) => page.url())
            .filter((url) => url !== 'https://www.browserscan.net/')
          this.dispatch('disconnected', { id: options.id, urls })
        })

        const [fristPage] = await browser.pages()
        const windowSize = await fristPage.evaluate(() => {
          return {
            width: window.innerWidth,
            height: window.innerHeight
          }
        })
        await fristPage.goto('chrome://bookmarks/')
        await setBookmarks(fristPage, options.bookmarks)
        fristPage.goto('https://www.browserscan.net/', { waitUntil: 'networkidle2' }).then(() => {
          fakeFingerPrint(fristPage)
        })
        fristPage.setViewport({ width: windowSize.width, height: windowSize.height })

        options.urls.forEach(async (url) => {
          const page = await browser.newPage()
          await page.goto(url, { waitUntil: 'networkidle2' })
          page.setViewport({ width: windowSize.width, height: windowSize.height })
          this.onPageChange(options.id, browser, page)
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  async close(id: string) {
    const browser = this.browsers.get(id)
    await browser.close()
    this.browsers.delete(id)
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

  private urls(id: string) {
    return this.browsers_urls.get(id)
  }

  private onPageChange(id: string, browser: any, page: any) {
    page.on('framenavigated', async (frame) => {
      if (frame === page.mainFrame()) {
        const urls = await browser.pages()
        this.browsers_urls.set(id, urls)
      }
    })
    page.on('framedetached', async (frame) => {
      if (frame === page.mainFrame()) {
        const urls = await browser.pages()
        this.browsers_urls.set(id, urls)
      }
    })
  }
}
