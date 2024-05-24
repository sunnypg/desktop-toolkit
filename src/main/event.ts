import { ipcMain, dialog, shell } from 'electron'

import Spider from './utils/spider/spider'
import { IProgress } from '../types/spider.type'
import { IBrowser } from '../types/browser.type'
import BrowserPool from './utils/browser/BrowserPool'
import removeDir from './utils/removeDir'
import { downloadBrowser, open } from './utils/browser/downloadBrowser'
import { startRecording, stopRecording } from './utils/screen/recording'
import { checkDirectory, getSize } from './utils/utils'
import { getCpuInfo, getMemory, getSysDisk, getSysInfo } from './utils/system'

export default function addEventListener(mainWindow) {
  const operation = {
    minimize: () => {
      mainWindow.focus()
      mainWindow.minimize()
    },
    maximize: () => {
      mainWindow.maximize()
    },
    restore: () => {
      mainWindow.restore()
    },
    close: () => {
      mainWindow.close()
    },
    reload: () => {
      mainWindow.reload()
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
    return mainWindow.isMaximized()
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

  ipcMain.on('download', async () => {
    downloadBrowser()
  })

  ipcMain.on('open_chromium', async () => {
    open()
  })

  ipcMain.on('startRecording', async (_, recordingConfig) => {
    startRecording(recordingConfig)
  })

  ipcMain.on('stopRecording', async () => {
    stopRecording()
  })

  ipcMain.handle('screen_size', async () => {
    return getSize()
  })

  ipcMain.handle('system_info', async () => {
    return {
      cpu: getCpuInfo(),
      mem: getMemory(),
      disk: getSysDisk(),
      sys: getSysInfo()
    }
  })
}
