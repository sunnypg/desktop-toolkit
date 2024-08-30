import { ipcMain, BrowserWindow, screen } from 'electron'
import Spider from './module/spider/spider'
import { IProgress } from '../types/spider.type'
import { IBrowser } from '../types/browser.type'
import BrowserPool from './module/browser/BrowserPool'
import { startRecording, stopRecording } from './module/screen/recording'
import { appAction, getSize, openDir, removeDir, selectDir } from './module/app'
import { getCpuInfo, getMemory, getSysDisk, getSysInfo } from './module/system'
import pinyin from 'pinyin'
import { getDesktopCapturerSource } from './module/screen/screen'
import { getDeviceIdCode, openWindow, windowAction } from './module/remote/remote'
import { keyboardAction, mouseAction, mousemoveAction } from './module/remote/remote-event'

export default function addEventListener(mainWindow) {
  ipcMain.on('resize', (_, type) => {
    appAction(type)
  })

  let spider: any = null
  ipcMain.on('start', (_, options) => {
    spider = new Spider(options)
    spider.on('progress', (progressInfo: IProgress) => {
      mainWindow.webContents.send('progress', progressInfo)
    })
    spider.on('finish', ({ type, status, url }) => {
      mainWindow.webContents.send('finish', { type, status, url })
    })
  })

  ipcMain.on('operate_spider', (_, { type, url }) => {
    spider[type](url)
  })

  ipcMain.handle('open-dir', (_, path) => {
    return openDir(path)
  })

  ipcMain.handle('isMaximized', () => {
    const activeWindow = BrowserWindow.getFocusedWindow() as BrowserWindow
    return activeWindow.isMaximized()
  })

  ipcMain.handle('selectDir', () => {
    return selectDir()
  })

  const browserPool = new BrowserPool()
  browserPool.on('disconnected', (info) => {
    mainWindow.webContents.send('disconnected', info)
  })
  ipcMain.handle('open', async (_, browser) => {
    browser = { ...browser, bookmarks: JSON.parse(browser.bookmarks) }
    await browserPool.open(browser)
  })

  ipcMain.handle('close', async (_, browser: IBrowser) => {
    await browserPool.close(browser.id)
  })

  ipcMain.handle('removeDir', async (_, url: string) => {
    removeDir(url)
  })

  ipcMain.handle('screen-sources', async (_, type: 'screen' | 'window' = 'window') => {
    return await getDesktopCapturerSource(type)
  })

  ipcMain.on('startRecording', async (_, recordingConfig) => {
    startRecording(recordingConfig, mainWindow)
  })

  ipcMain.on('stopRecording', async () => {
    stopRecording()
  })

  ipcMain.handle('screen_size', async () => {
    return getSize()
  })

  ipcMain.handle('all_screen_size', async () => {
    return screen.getAllDisplays()
  })

  ipcMain.handle('system_info', async () => {
    return {
      cpu: getCpuInfo(),
      mem: getMemory(),
      disk: getSysDisk(),
      sys: getSysInfo()
    }
  })

  ipcMain.handle('pinyin', async (_, text) => {
    return pinyin(text, { style: pinyin.STYLE_NORMAL }).join('')
  })

  ipcMain.handle('id_code', async () => {
    return await getDeviceIdCode()
  })

  ipcMain.handle('open-window', async (_, { route, remote_id }) => {
    openWindow(route, remote_id, mainWindow)
  })

  ipcMain.handle('window-handle', (_, { id, type }) => {
    windowAction(id, type)
  })

  ipcMain.on('keyboard-event', async (_event, { type, code }) => {
    keyboardAction(type, code)
  })

  ipcMain.on('mouse-move', async (_event, data) => {
    mousemoveAction(data.x, data.y)
  })

  ipcMain.on('mouse-event', async (_event, data) => {
    mouseAction(data)
  })
}
