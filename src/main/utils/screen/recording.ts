import { spawn, ChildProcess } from 'child_process'
import ffmpegPath from 'ffmpeg-static'
import { join } from 'path'
import { getSize } from '../utils'

let ffmpegProcess: ChildProcess | null = null
const startRecording = async (config) => {
  let ffmpegCommand
  let { definition, fps, type, saveDir } = config
  const { width, height } = getSize()
  definition = `${width * definition}x${height * definition}`
  const fileName = join(saveDir, `录屏_${+new Date()}.${type}`)

  if (type === 'webm') {
    ffmpegCommand = `${ffmpegPath} -f gdigrab -framerate ${fps} -video_size ${definition} -i "desktop" -c:v libvpx-vp9 -c:a libopus ${fileName}`
  } else if (type === 'mp4') {
    ffmpegCommand = `${ffmpegPath} -f gdigrab -framerate ${fps} -video_size ${definition} -i "desktop" -fps_mode vfr -c:v libx264 -preset ultrafast -qp 0 -c:a aac ${fileName}`
  } else if (type === 'gif') {
    ffmpegCommand = `${ffmpegPath} -f gdigrab -framerate ${fps} -video_size ${definition} -i "desktop" -vf "fps=15" -c:v gif ${fileName}`
  }

  ffmpegProcess = spawn(ffmpegCommand, { shell: true })
  ffmpegProcess!.stderr!.on('data', (data) => {
    console.error(`${data}`)
  })
  ffmpegProcess.on('exit', (code, signal) => {
    console.log(`exited ${code} ${signal}`)
  })
}

const stopRecording = () => {
  if (ffmpegProcess) {
    ffmpegProcess.kill('SIGINT')
  }
}

export { startRecording, stopRecording }
