import { app, shell, BrowserWindow, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import addEventListener from './event'
import createTray from './tray'
import createCutWindow from './module/screen/screenshot'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    frame: false,
    icon: join(__dirname, '../../resources/logo.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  addEventListener(mainWindow)
  createTray(mainWindow)

  // 添加右键菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '还原',
      click: () => {
        mainWindow.restore()
      }
    },
    {
      label: '最小化',
      role: 'minimize'
    },
    {
      label: '最大化',
      click: () => {
        mainWindow.maximize()
      }
    },
    {
      label: '刷新',
      role: 'reload'
    },
    { type: 'separator' },
    {
      label: '关闭',
      role: 'close'
    }
  ])
  mainWindow.webContents.on('context-menu', (_event, params) => {
    if (!params.pageURL.includes('main/control')) {
      contextMenu.popup()
    }
  })

  // 避免启动多个app
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.focus()
      mainWindow.show()
    }
  })

  mainWindow.on('closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  // 在开发中默认使用F12打开或关闭DevTools
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()
  createCutWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
