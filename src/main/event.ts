import { ipcMain, dialog } from 'electron'

export default function addEventListener(mainWindow) {
  ipcMain.on('selectDir', (event) => {
    dialog
      .showOpenDialog({
        properties: ['openDirectory']
      })
      .then((result) => {
        if (!result.canceled) {
          const selectedFolder = result.filePaths[0]
          event.reply('selectDirReply', selectedFolder)
        }
      })
      .catch((err) => {
        console.error('选择文件夹时发生错误:', err)
      })
  })

  ipcMain.on('minimize', () => {
    mainWindow.minimize()
  })
  ipcMain.on('maximize', () => {
    mainWindow.maximize()
  })
  ipcMain.on('restore', () => {
    mainWindow.restore()
  })
  ipcMain.on('close', () => {
    mainWindow.close()
  })
  ipcMain.on('reload', () => {
    mainWindow.reload()
  })
  ipcMain.handle('isMaximized', () => {
    return mainWindow.isMaximized()
  })
}
