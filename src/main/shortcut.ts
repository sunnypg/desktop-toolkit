import { BrowserWindow, globalShortcut } from 'electron'
import { screenshot } from './module/screen/screenshot'

interface Shortcut {
  key: string
  callback: () => any
}

export default function registerGlobalShortcut(trayWindow: BrowserWindow) {
  const shortcutList: Shortcut[] = [
    {
      key: 'CommandOrControl+Q',
      callback: screenshot
    },
    {
      key: 'CommandOrControl+R',
      callback: () => trayWindow.webContents.send('shortcut-start-recording')
    },
    {
      key: 'CommandOrControl+T',
      callback: () => trayWindow.webContents.send('shortcut-stop-recording')
    }
  ]

  shortcutList.forEach((item) => {
    globalShortcut.register(item.key, item.callback)
  })
}
