import { BrowserWindow, dialog, screen, shell } from 'electron'
import { join } from 'path'
const fs = require('fs').promises

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
export function appAction(type: string) {
  operation[type]()
}

export function checkDirectory(path) {
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

export function openDir(path) {
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
}

export function selectDir() {
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
}

export async function removeDir(url) {
  return new Promise(async (resolve, reject) => {
    try {
      const isExist = await checkDirectory(url)
      if (!isExist) {
        resolve({ message: '文件夹不存在' })
      }
      const files = await fs.readdir(url)
      for (const file of files) {
        const curPath = join(url, file)
        const stats = await fs.lstat(curPath)

        if (stats.isDirectory()) {
          await removeDir(curPath) // 文件夹递归删除
        } else {
          await fs.unlink(curPath) // 文件直接删除
        }
      }
      await fs.rmdir(url) // 清除文件夹
      resolve({ message: '文件夹已删除' })
    } catch (error) {
      reject(error)
    }
  })
}

export function getSize() {
  const { size, scaleFactor } = screen.getPrimaryDisplay()
  return {
    width: size.width * scaleFactor,
    height: size.height * scaleFactor
  }
}
