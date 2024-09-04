import { app } from 'electron'
import axios from 'axios'
const path = require('path')
const browserApi = require('@puppeteer/browsers')

const cacheDir = path.join(app.getPath('appData'), 'chrome')

// 获取最新的chromium构建ID
function getLastBuildId() {
  return new Promise((resolve, reject) => {
    const url = `https://download-chromium.appspot.com/rev/${process.platform === 'darwin' ? 'mac' : 'Win_x64'}?type=snapshots`
    axios
      .get(url)
      .then((res) => resolve(res.data.content))
      .catch(reject)
  })
}

// 获取安装的浏览器路径
function getChromePath() {
  return new Promise((resolve) => {
    browserApi
      .getInstalledBrowsers({ cacheDir })
      .then((list) => {
        const executablePath = list[0]?.executablePath
        if (executablePath) {
          resolve({ message: '获取成功', path: executablePath })
        } else {
          resolve({ message: '未安装浏览器' })
        }
      })
      .catch(() => resolve({ message: '获取失败' }))
  })
}

// 下载chromium
function downloadBrowser() {
  return new Promise(async (resolve) => {
    try {
      const buildId = await getLastBuildId()
      await browserApi.install({
        cacheDir,
        browser: browserApi.Browser.CHROMIUM,
        buildId,
        baseUrl: 'https://commondatastorage.googleapis.com/chromium-browser-snapshots'
      })
      resolve({ code: 0, message: '安装成功' })
    } catch (error) {
      resolve({ code: 1, message: '安装失败' })
    }
  })
}

export { getChromePath, downloadBrowser }
