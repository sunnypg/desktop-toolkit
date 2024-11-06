import { app, BrowserWindow, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import { is } from '@electron-toolkit/utils'
import { join } from 'path'

let isAutoCheck = true
export default function updateAppAction(window: BrowserWindow) {
  if (is.dev) {
    Object.defineProperty(app, 'isPackaged', {
      get() {
        return true
      }
    })
    autoUpdater.updateConfigPath = join(__dirname, '../../dev-app-update.yml')
  }

  autoUpdater.autoDownload = false // 不允许自动下载更新
  autoUpdater.allowDowngrade = true // 允许降级更新（应付回滚的情况）

  autoUpdater.on('checking-for-update', () => {
    window.webContents.send('updater-event', {
      event: 'checking-for-update',
      msg: '正在检查是否有新版本...',
      data: null
    })
  })

  autoUpdater.on('update-available', (info) => {
    window.webContents.send('updater-event', {
      event: 'update-available',
      msg: '发现新版本，是否需要立即下载？',
      data: info
    })
  })
  autoUpdater.on('update-not-available', (info) => {
    if (isAutoCheck) return
    window.webContents.send('updater-event', {
      event: 'update-not-available',
      msg: `当前为最新版本 v${info.version}，无需更新`,
      data: info
    })
  })

  autoUpdater.on('download-progress', (progressInfo) => {
    window.webContents.send('updater-event', {
      event: 'download-progress',
      msg: '正在下载新版本安装包...',
      data: progressInfo
    })
  })

  autoUpdater.on('update-downloaded', () => {
    window.webContents.send('updater-event', {
      event: 'update-downloaded',
      msg: '更新下载完成，应用将退出并进行安装',
      data: null
    })
  })

  autoUpdater.on('error', () => {})

  // 非打包情况下，下面的函数不起作用，开发环境要用checkForUpdates()
  // autoUpdater.checkForUpdatesAndNotify()
  autoUpdater.checkForUpdates()

  ipcMain.on('checking-for-update', () => {
    isAutoCheck = false
    autoUpdater.checkForUpdates()
  })

  ipcMain.on('download-update', () => {
    autoUpdater.downloadUpdate()
  })

  ipcMain.on('quit-and-install', () => {
    autoUpdater.quitAndInstall()
  })
}
