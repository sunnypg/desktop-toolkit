import { ipcMain, dialog, shell } from 'electron'
import Crawler, { ICrawlerOptions } from './crawler'
const fs = require('fs').promises

function checkDirectory(path) {
  return new Promise(async (resolve, reject) => {
    try {
      await fs.access(path)
      resolve(true)
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        resolve(false)
      } else {
        reject(err)
      }
    }
  })
}

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

  ipcMain.on('start', (_, options: ICrawlerOptions) => {
    const crawler = new Crawler(options)
    crawler.getPages()
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
}
