import { BrowserWindow, ipcMain, clipboard, nativeImage } from 'electron'
import { is } from '@electron-toolkit/utils'
import { join } from 'path'
import { getSize } from '../app'
import { mouse, Point } from '@scanood/nut-js'

let cutWindow: BrowserWindow
export default function createCutWindow() {
  const { width, height } = getSize()
  cutWindow = new BrowserWindow({
    width,
    height,
    skipTaskbar: true,
    autoHideMenuBar: true,
    useContentSize: true,
    movable: false,
    frame: false,
    resizable: false,
    hasShadow: false,
    transparent: true,
    fullscreenable: true,
    fullscreen: true,
    simpleFullscreen: true,
    alwaysOnTop: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  cutWindow.hide()
}

ipcMain.on('screenshot', async () => {
  screenshot()
})

export async function screenshot() {
  const { width, height } = getSize()
  const point = new Point(width + 10, height + 10)
  await mouse.move([point]) // 把光标移出屏幕
  const routerPath = '#/cut'
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    let url = process.env['ELECTRON_RENDERER_URL'] + routerPath
    cutWindow.loadURL(url)
  } else {
    cutWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: routerPath })
  }
  cutWindow.show()
  cutWindow.maximize()
  cutWindow.setFullScreen(true)
}

ipcMain.on('show-cursor', () => {
  const { width, height } = getSize()
  const point = new Point(width * 0.5, height * 0.5)
  mouse.move([point])
})

ipcMain.on('screenshot-callback', (_, data) => {
  data = JSON.parse(data)
  if (data.action === 'save') {
    console.log('保存成功')
  } else if (data.action === 'complete') {
    const imageData = nativeImage.createFromDataURL(data.info.base64)
    clipboard.writeImage(imageData)
    console.log('截图成功')
  } else if (data.action === 'close') {
    console.log('关闭截图')
  }
  cutWindow.hide()
})
