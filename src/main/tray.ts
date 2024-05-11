import { Tray, Menu } from 'electron'
import { join } from 'path'

export default function createTray(win) {
  let tray = new Tray(join(__dirname, '../../resources/logo.jpg'))
  tray.setToolTip('爬虫大师')
  tray.on('click', () => {
    win.isVisible() ? win.hide() : win.show()
  })
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: '退出',
        type: 'normal',
        role: 'quit'
      }
    ])
  )
}
