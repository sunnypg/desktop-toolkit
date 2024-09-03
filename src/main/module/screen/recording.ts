import { spawn, ChildProcess } from 'child_process'
import ffmpegPath from 'ffmpeg-static'
import { join } from 'path'
import { BrowserWindow, ipcMain } from 'electron'
import { getSize } from '../app'
import { is } from '@electron-toolkit/utils'
import crypto from 'crypto'

let recordingWindow: BrowserWindow | null = null
const width = 180
const height = 50
const createRecordingWindow = (mainWindow: BrowserWindow) => {
  recordingWindow = new BrowserWindow({
    width,
    height,
    show: false,
    frame: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true,
    transparent: true,
    autoHideMenuBar: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  const routerPath = '#/recording'
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    let url = process.env['ELECTRON_RENDERER_URL'] + routerPath
    recordingWindow.loadURL(url)
  } else {
    recordingWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: routerPath })
  }

  ipcMain.on('recording-start', onRecordingStart)

  ipcMain.on('show-setting', () => {
    mainWindow.show()
    mainWindow.webContents.executeJavaScript(
      `window.location.hash = "#/main/screen?id=${crypto.randomUUID()}"`
    )
    mainWindow.focus()
  })

  ipcMain.on('shake-window', () => {
    if (!recordingWindow) return
    const originalPosition = recordingWindow.getPosition()
    const [x, y] = originalPosition

    let shakeCount = 0
    const interval = setInterval(() => {
      shakeCount++
      if (shakeCount % 2 === 0) {
        recordingWindow?.setPosition(x + 3, y)
      } else {
        recordingWindow?.setPosition(x - 3, y)
      }
      if (shakeCount === 10) {
        clearInterval(interval)
      }
    }, 50)
  })

  ipcMain.on('hide-recording', () => {
    recordingWindow?.hide()
  })
}

function onRecordingStart() {
  if (recordingWindow && !recordingWindow.isVisible()) {
    const { width: screenWidth, height: screenHeight } = getSize()
    recordingWindow?.setPosition(screenWidth - width - 30, screenHeight / 2 - height / 2)
  }
  recordingWindow?.show()
  recordingWindow?.webContents.send('recording-start')
}

let ffmpegProcess: ChildProcess | null = null
const startRecording = async (config: any, trayWindow: BrowserWindow) => {
  let ffmpegCommand
  let { definition, fps, type, saveDir } = config
  const { width, height } = getSize()
  definition = `${width * definition}x${height * definition}`
  const fileName = join(saveDir, `录屏_${+new Date()}.${type}`)

  const capturer = process.platform === 'darwin' ? 'avfoundation' : 'gdigrab'
  if (type === 'webm') {
    ffmpegCommand = `${ffmpegPath} -f ${capturer} -framerate ${fps} -video_size ${definition} -i "desktop" -c:v libvpx-vp9 -c:a libopus ${fileName}`
  } else if (type === 'mp4') {
    ffmpegCommand = `${ffmpegPath} -f ${capturer} -framerate ${fps} -video_size ${definition} -i "desktop" -fps_mode vfr -c:v libx264 -preset ultrafast -qp 0 -c:a aac ${fileName}`
  } else if (type === 'gif') {
    ffmpegCommand = `${ffmpegPath} -f ${capturer} -framerate ${fps} -video_size ${definition} -i "desktop" -vf "fps=15" -c:v gif ${fileName}`
  }

  ffmpegProcess = spawn(ffmpegCommand, { shell: true })
  ffmpegProcess!.stderr!.on('data', (data) => {
    recordingWindow?.webContents.send('recording', data.toString())
    trayWindow.webContents.send('recording')
  })
  ffmpegProcess.on('exit', () => {
    recordingWindow?.webContents.send('recording-exit')
    trayWindow.webContents.send('recording-exit')
  })
}

const stopRecording = () => {
  if (ffmpegProcess) {
    process.platform === 'darwin' ? ffmpegProcess.kill('SIGINT') : ffmpegProcess.stdin?.write('q')
  }
}

export { createRecordingWindow, startRecording, stopRecording, onRecordingStart }
