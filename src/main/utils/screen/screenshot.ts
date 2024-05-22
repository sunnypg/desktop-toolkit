import {
  BrowserWindow,
  ipcMain,
  desktopCapturer,
  webContents,
  screen,
  clipboard,
  nativeImage,
  globalShortcut
} from 'electron'
import { is } from '@electron-toolkit/utils'
import { join } from 'path'

const selfWindows = async () =>
  await Promise.all(
    webContents
      .getAllWebContents()
      .filter((item) => {
        const win = BrowserWindow.fromWebContents(item)
        return win && win.isVisible()
      })
      .map(async (item) => {
        const win = BrowserWindow.fromWebContents(item)
        const thumbnail = await win?.capturePage()
        // 当程序窗口打开DevTool的时候  也会计入
        return {
          name: win?.getTitle() + (item.devToolsWebContents === null ? '' : '-dev'), // 给dev窗口加上后缀
          id: win?.getMediaSourceId(),
          thumbnail,
          display_id: '',
          appIcon: null
        }
      })
  )

const getDesktopCapturerSource = async () => {
  return [
    ...(await desktopCapturer.getSources({ types: ['window', 'screen'] })),
    ...(await selfWindows())
  ]
}

function getSize() {
  const { size, scaleFactor } = screen.getPrimaryDisplay()
  return {
    width: size.width * scaleFactor,
    height: size.height * scaleFactor
  }
}

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
  globalShortcut.register('CommandOrControl+Q', () => {
    screenshot()
  })
}

let sources: any = null
ipcMain.on('screenshot', async () => {
  screenshot()
})

export async function screenshot() {
  sources = await getDesktopCapturerSource()
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    let url = process.env['ELECTRON_RENDERER_URL'] + '/cut'
    cutWindow.loadURL(url)
  } else {
    cutWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
  cutWindow.show()
  cutWindow.maximize()
  cutWindow.setFullScreen(true)
}

ipcMain.handle('screenshot-sources', () => {
  return sources
})

ipcMain.on('screenshot-callback', (_, data) => {
  data = JSON.parse(data)
  if (data.action === 'save') {
    console.log('保存成功')
  } else if (data.action === 'complete') {
    const imageData = nativeImage.createFromDataURL(data.info.base64)
    clipboard.writeImage(imageData)
  } else if (data.action === 'close') {
    console.log('关闭截图')
  }
  cutWindow.hide()
})
