import { app, shell, BrowserWindow, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import addEventListener from './event'
import createTray from './tray'
import createCutWindow from './module/screen/screenshot'
import registerGlobalShortcut from './shortcut'
import { createRecordingWindow } from './module/screen/recording'
import updateAppAction from './update'

let mainWindow: BrowserWindow | null
let willQuit = false
function createWindow(): void {
  mainWindow = new BrowserWindow({
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
    mainWindow?.show()
    mainWindow && updateAppAction(mainWindow)
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

  const trayWindow = createTray(mainWindow)
  addEventListener(mainWindow, trayWindow)
  createRecordingWindow(mainWindow)
  registerGlobalShortcut()

  // 添加右键菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '还原',
      click: () => {
        mainWindow?.restore()
      }
    },
    {
      label: '最小化',
      role: 'minimize'
    },
    {
      label: '最大化',
      click: () => {
        mainWindow?.maximize()
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

  mainWindow.on('close', (e) => {
    if (willQuit) {
      app.quit()
    } else {
      e.preventDefault()
      mainWindow?.hide()
    }
  })
}

// 避免启动多个app
const gotTheLock = app.requestSingleInstanceLock()
app.on('second-instance', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }
    mainWindow.focus()
    mainWindow.show()
  }
})

if (!gotTheLock) {
  app.quit()
} else {
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
}

app.on('before-quit', () => {
  willQuit = true
  mainWindow?.close()
})

app.on('activate', () => {
  mainWindow?.show()
})
