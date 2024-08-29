import { ipcMain, dialog, shell, BrowserWindow, screen } from 'electron'
import Spider from './utils/spider/spider'
import { IProgress } from '../types/spider.type'
import { IBrowser } from '../types/browser.type'
import BrowserPool from './utils/browser/BrowserPool'
import removeDir from './utils/removeDir'
import { startRecording, stopRecording } from './utils/screen/recording'
import { checkDirectory, getSize } from './utils/utils'
import { getCpuInfo, getMemory, getSysDisk, getSysInfo } from './utils/system'
import pinyin from 'pinyin'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import getDesktopCapturerSource from './utils/screen/screen'
import { Button, keyboard, mouse, Point } from '@scanood/nut-js'
import { keymap } from './utils/control/keymap'
import os from 'os'
import crypto from 'crypto'

export default function addEventListener(mainWindow) {
  const operation = {
    minimize: () => {
      const activeWindow = BrowserWindow.getFocusedWindow() as BrowserWindow
      activeWindow.focus()
      activeWindow.minimize()
    },
    maximize: () => {
      const activeWindow = BrowserWindow.getFocusedWindow() as BrowserWindow
      activeWindow.maximize()
    },
    restore: () => {
      const activeWindow = BrowserWindow.getFocusedWindow() as BrowserWindow
      activeWindow.restore()
    },
    close: () => {
      const activeWindow = BrowserWindow.getFocusedWindow() as BrowserWindow
      activeWindow.close()
    },
    reload: () => {
      const activeWindow = BrowserWindow.getFocusedWindow() as BrowserWindow
      activeWindow.reload()
    }
  }
  ipcMain.on('resize', (_, type) => {
    operation[type]()
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
    return new Promise(async (resolve, reject) => {
      const isExist = await checkDirectory(path)
      if (!isExist) {
        resolve({ isExist: false, message: '文件夹不存在' })
      } else {
        shell
          .openPath(path)
          .then(() => {
            resolve({ isExist: true, message: '文件夹已成功打开' })
          })
          .catch((err) => {
            reject(err)
          })
      }
    })
  })
  ipcMain.handle('isMaximized', () => {
    const activeWindow = BrowserWindow.getFocusedWindow() as BrowserWindow
    return activeWindow.isMaximized()
  })
  ipcMain.handle('selectDir', () => {
    return new Promise((resolve, reject) => {
      dialog
        .showOpenDialog({
          properties: ['openDirectory']
        })
        .then((result) => {
          if (!result.canceled) {
            const selectedFolder = result.filePaths[0]
            resolve(selectedFolder)
          }
        })
        .catch((err) => {
          reject(err)
        })
    })
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
    await removeDir(url)
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

  ipcMain.handle('id_code', async () => {
    const networkInterfaces = await os.networkInterfaces()
    const nets = Object.values(networkInterfaces).flat(2)
    const MAC = nets.find((item) => !item?.internal && item?.mac !== '00:00:00:00:00:00')?.mac
    const hashMAC = MAC ? crypto.createHash('sha256').update(MAC).digest('hex') : ''
    const intHash = BigInt('0x' + hashMAC).toString()

    return {
      system_id: intHash.substring(0, 9),
      code: intHash.substring(intHash.length - 7, intHash.length - 1)
    }
  })

  ipcMain.handle('pinyin', async (_, text) => {
    return pinyin(text, { style: pinyin.STYLE_NORMAL }).join('')
  })

  const windowMap: Map<string, BrowserWindow> = new Map()
  ipcMain.handle('open-window', async (_, { route, remote_id }) => {
    const remoteWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      show: false,
      frame: false,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        nodeIntegration: true,
        contextIsolation: false
      }
    })
    if (remote_id) windowMap.set(remote_id, remoteWindow)
    const routerPath = remote_id ? `#${route}?remote_id=${remote_id}` : `#${route}`
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      let url = process.env['ELECTRON_RENDERER_URL'] + routerPath
      remoteWindow.loadURL(url)
    } else {
      remoteWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: routerPath })
    }
    remoteWindow.show()
    remoteWindow.on('close', () => {
      mainWindow.webContents.send('remote-close', remote_id)
    })
  })

  ipcMain.handle('window-handle', (_, { id, type }) => {
    const window = windowMap.get(id)
    switch (type) {
      case 'show':
        window?.show()
        break
      case 'hide':
        window?.hide()
        break
      case 'close':
        window?.destroy() // 这里不要触发close事件
        break
      default:
        break
    }
  })

  keyboard.config.autoDelayMs = 5
  ipcMain.on('keyboard-event', async (_event, { type, code }) => {
    const key = keymap.get(code)
    if (!key) return
    switch (type) {
      case 'keydown':
        keyboard.pressKey(key)
        break
      case 'keyup':
        keyboard.releaseKey(key)
        break
    }
  })

  mouse.config.mouseSpeed = 0
  ipcMain.on('mouse-move', async (_event, data) => {
    const point = new Point(data.x, data.y)
    await mouse.move([point])
  })

  ipcMain.on('mouse-event', async (_event, data) => {
    const buttonMap = {
      0: Button.LEFT,
      1: Button.MIDDLE,
      2: Button.RIGHT
    }

    if (data.type === 'mousedown') {
      mouse.pressButton(buttonMap[data.button])
    } else if (data.type === 'mouseup') {
      mouse.releaseButton(buttonMap[data.button])
    } else if (data.type === 'mousewheel') {
      if (data.deltaY > 0) {
        mouse.scrollDown(data.deltaY)
      } else if (data.deltaY < 0) {
        mouse.scrollUp(Math.abs(data.deltaY))
      }
    }
  })
}
