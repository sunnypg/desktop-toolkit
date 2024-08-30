import os from 'os'
import crypto from 'crypto'
import { BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

export async function getDeviceIdCode() {
  const networkInterfaces = await os.networkInterfaces()
  const nets = Object.values(networkInterfaces).flat(2)
  const MAC = nets.find((item) => !item?.internal && item?.mac !== '00:00:00:00:00:00')?.mac
  const hashMAC = MAC ? crypto.createHash('sha256').update(MAC).digest('hex') : ''
  const intHash = BigInt('0x' + hashMAC).toString()

  return {
    system_id: intHash.substring(0, 9),
    code: intHash.substring(intHash.length - 7, intHash.length - 1)
  }
}

const windowMap: Map<string, BrowserWindow> = new Map()
export function openWindow(route: string, remote_id: string, mainWindow: BrowserWindow) {
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
}

export function windowAction(id: string, type: string) {
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
}
