const { Tray } = require('electron')
import { is } from '@electron-toolkit/utils'
import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { getSize } from './module/app'

export default function createTray(win) {
  const tray = new Tray(join(__dirname, '../../resources/logo.png'))
  tray.setToolTip('桌面工具箱')
  tray.on('click', () => {
    win.isVisible() ? win.hide() : win.show()
  })

  const width = 150
  const height = 128
  const trayWindow = new BrowserWindow({
    width,
    height,
    show: false,
    frame: false,
    movable: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    transparent: true,
    skipTaskbar: true,
    autoHideMenuBar: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  const routerPath = '#/tray'
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    let url = process.env['ELECTRON_RENDERER_URL'] + routerPath
    trayWindow.loadURL(url)
  } else {
    trayWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: routerPath })
  }

  tray.on('right-click', () => {
    const { height: screenHeight } = getSize()
    const trayBounds = tray.getBounds()

    trayWindow.setPosition(
      trayBounds.x + trayBounds.width / 2,
      screenHeight - trayBounds.height / 2 - height
    )
    trayWindow.show()
  })

  trayWindow.on('blur', () => {
    trayWindow.hide()
  })

  ipcMain.on('exit', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  return trayWindow
}
