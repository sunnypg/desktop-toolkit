const { Tray, Menu } = require('electron')
import { join } from 'path'
import { screenshot } from './utils/screen/screenshot'

export default function createTray(win) {
  const tray = new Tray(join(__dirname, '../../resources/logo.png'))
  tray.setToolTip('桌面工具箱')
  tray.on('click', () => {
    win.isVisible() ? win.hide() : win.show()
  })
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: '截图',
        accelerator: 'CmdOrCtrl+Q',
        type: 'normal',
        click: () => {
          screenshot()
        }
      },
      { type: 'separator' },
      {
        label: '退出',
        role: 'quit'
      }
    ])
  )
}
