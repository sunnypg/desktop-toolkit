import { app } from 'electron'
import axios from 'axios'
const path = require('path')
const browserApi = require('@puppeteer/browsers')
const puppeteer = require('puppeteer-core')

const cacheDir = path.join(app.getPath('appData'), 'myBrowser')
// 获取最新的chromium构建ID
function getLastBuildId() {
  return new Promise((resolve, reject) => {
    axios
      .get(`https://download-chromium.appspot.com/rev/Win_x64?type=snapshots`)
      .then((res) => resolve(res.data.content))
      .catch(reject)
  })
}

// 获取安装的浏览器路径
async function getChromePath() {
  return new Promise((resolve, reject) => {
    browserApi
      .getInstalledBrowsers({ cacheDir })
      .then((list) => {
        const executablePath = list[0]?.executablePath
        if (executablePath) {
          resolve(executablePath)
        } else {
          reject('未安装浏览器')
        }
      })
      .catch((err) => reject(err))
  })
}

// 下载chromium
export async function downloadBrowser() {
  try {
    const buildId = await getLastBuildId()
    console.log(`缓存地址: ${cacheDir}，构建ID: ${buildId}`)

    browserApi.install({
      cacheDir,
      browser: browserApi.Browser.CHROMIUM,
      buildId,
      baseUrl: 'https://commondatastorage.googleapis.com/chromium-browser-snapshots'
    })
  } catch (error) {
    console.log('下载失败', error)
  }
}

// 打开浏览器
export async function open() {
  try {
    const executablePath = await getChromePath()

    const browser = await puppeteer.launch({
      headless: false,
      executablePath,
      defaultViewport: null,
      ignoreDefaultArgs: ['about:blank']
    })
    const [fristPage] = await browser.pages()
    const windowSize = await fristPage.evaluate(() => {
      return {
        width: window.innerWidth,
        height: window.innerHeight
      }
    })
    fristPage.goto('https://www.browserscan.net/', { waitUntil: 'networkidle2' })
    fristPage.setViewport({ width: windowSize.width, height: windowSize.height })
  } catch (error) {
    console.log('打开失败', error)
  }
}
