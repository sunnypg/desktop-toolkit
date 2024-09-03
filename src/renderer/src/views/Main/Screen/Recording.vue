<template>
  <div ref="recordingRef" class="recording">
    <span class="recording-icon" @click="() => (isRecording ? stopRecording() : startRecording())">
      <span :class="isRecording ? 'recording-stop-icon' : 'recording-start-icon'"></span>
    </span>
    <template v-if="!isRecording">
      <el-icon @click="openFolder"><FolderOpened /></el-icon>
      <el-icon @click="showSetting"><Setting /></el-icon>
      <el-icon @click="close"><Close /></el-icon>
    </template>
    <span v-else class="recording-time">{{ recordingTime }}</span>
    <div class="error">{{ errorMessage }}</div>
  </div>
</template>

<script setup lang="ts">
import useDrag from '@renderer/hooks/useDrag'
import { myLocalStorage } from '@renderer/utils/storage'

interface Stats {
  frame: string
  fps: string
  q: string
  size: string
  speed: string
  time: string
  bitrate: string
}

const recordingRef = useDrag()
const isRecording = ref(false)
const errorMessage = ref('')
const recordingTime = ref('00:00:00')
const setErrorMessage = (message: string) => {
  errorMessage.value = message
  setTimeout(() => {
    errorMessage.value = ''
  }, 3000)
}

const parseFFmpegStats = (statsString): Stats => {
  const result = {}
  const regex = /(\w+)\s*=\s*(\S+)/g
  let match
  while ((match = regex.exec(statsString)) !== null) {
    const key = match[1]
    const value = match[2].trim()
    result[key] = value
  }
  return result as Stats
}
const startRecording = () => {
  let recordingConfig = myLocalStorage.getStorage('recordingConfig')
  if (!recordingConfig) {
    window.electron.ipcRenderer.send('shake-window')
    setErrorMessage('no recording configuration')
    return
  }
  if (isRecording.value) return
  isRecording.value = true
  window.electron.ipcRenderer.send('main-recording-start', recordingConfig)
}

window.electron.ipcRenderer.on('recording-start', startRecording)
window.electron.ipcRenderer.on('recording', (_, data) => {
  isRecording.value = true
  const stats = parseFFmpegStats(data)
  if (stats.frame !== '0') {
    recordingTime.value = stats.time
  }
})

const stopRecording = () => {
  if (!isRecording.value) return
  isRecording.value = false
  window.electron.ipcRenderer.send('main-recording-stop')
}

window.electron.ipcRenderer.on('recording-exit', () => {
  isRecording.value = false
})

const openFolder = () => {
  const recordingConfig = myLocalStorage.getStorage('recordingConfig')
  if (!recordingConfig) {
    window.electron.ipcRenderer.send('shake-window')
    setErrorMessage('no recording configuration')
    return
  }
  window.electron.ipcRenderer.invoke('open-dir', recordingConfig.saveDir)
}

const showSetting = () => {
  window.electron.ipcRenderer.send('show-setting')
}

const close = () => {
  window.electron.ipcRenderer.send('hide-recording')
}
</script>

<style scoped lang="less">
.recording {
  width: 100%;
  height: 50px;
  background-color: #fff;
  border-radius: 40px;
  cursor: pointer;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: space-around;
  align-items: center;

  .recording-icon {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background-color: #fff;
    display: flex;
    justify-content: center;
    align-items: center;

    .recording-start-icon,
    .recording-stop-icon {
      background-color: red;
      transition:
        width 0.5s,
        height 0.5s;
    }
    .recording-start-icon {
      width: 26px;
      height: 26px;
      border-radius: 50%;
    }
    .recording-stop-icon {
      width: 14px;
      height: 14px;
      border-radius: 3px;
    }
  }

  .el-icon {
    color: #fff;
  }

  .recording-time {
    color: #fff;
    margin-right: 15px;
  }

  .error {
    font-size: 10px;
    color: #f56c6c;
    background-color: rgba(0, 0, 0, 0);
    position: absolute;
    top: 38px;
    font-style: italic;
  }
}
</style>
