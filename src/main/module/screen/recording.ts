import { spawn, ChildProcess } from 'child_process'
import ffmpegPath from 'ffmpeg-static'
import { join } from 'path'
import { BrowserWindow } from 'electron'
import { getSize } from '../app'

let ffmpegProcess: ChildProcess | null = null
const startRecording = async (config, window: BrowserWindow) => {
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
    window.webContents.send('recording', data.toString())
  })
  ffmpegProcess.on('exit', () => {
    window.webContents.send('recording-exit')
  })
}

const stopRecording = () => {
  if (ffmpegProcess) {
    process.platform === 'darwin' ? ffmpegProcess.kill('SIGINT') : ffmpegProcess.stdin?.write('q')
  }
}

export { startRecording, stopRecording }
