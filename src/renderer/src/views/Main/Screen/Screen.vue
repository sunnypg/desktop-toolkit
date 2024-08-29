<template>
  <div class="screen">
    <el-card style="height: calc(100vh - 80px)">
      <el-row>
        <el-col :span="6">
          <div ref="cardRef1" class="card">
            <div class="header">
              <h3>截屏</h3>
              <span class="more">
                更多<el-icon><ArrowRight /></el-icon>
              </span>
            </div>
            <div class="content" @click="screenshot">
              <el-icon><Scissor /></el-icon>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div ref="cardRef2" class="card">
            <div class="header" @click="recordingConfig">
              <h3>录屏</h3>
              <span class="more">
                更多<el-icon><ArrowRight /></el-icon>
              </span>
            </div>
            <div class="content">
              <div>
                <el-icon @click="startRecording"><Camera /></el-icon>
              </div>
              <div>
                <el-icon @click="stopRecording"><VideoPause /></el-icon>
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div ref="cardRef3" class="card">
            <div class="header">
              <h3>录像</h3>
              <span class="more">
                更多<el-icon><ArrowRight /></el-icon>
              </span>
            </div>
            <div class="content" @click="video">
              <el-icon><VideoCamera /></el-icon>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div ref="cardRef4" class="card">
            <div class="header">
              <h3>录音</h3>
              <span class="more">
                更多<el-icon><ArrowRight /></el-icon>
              </span>
            </div>
            <div class="content" @click="audio">
              <el-icon><Microphone /></el-icon>
            </div>
          </div>
        </el-col>
      </el-row>
      <div v-if="recordingLog.length" ref="recordingLogRef" class="recording-log">
        <el-icon class="close" @click="recordingLog = []"><Close /></el-icon>
        <div v-for="item in recordingLog" :key="item" class="log-item">{{ item }}</div>
      </div>
    </el-card>
    <RecordingConfig ref="recordingConfigRef" @confirm="confirm"></RecordingConfig>
  </div>
</template>

<script setup lang="ts">
import { useLightCard } from '@renderer/hooks/use-light-card'
import RecordingConfig from './cps/RecordingConfig.vue'
import { ElNotification, ElTag, NotificationHandle } from 'element-plus'
import { myLocalStorage } from '@renderer/utils/storage'

const { cardRef: cardRef1 } = useLightCard()
const { cardRef: cardRef2 } = useLightCard({
  light: {
    color: 'green',
    width: 100
  }
})
const { cardRef: cardRef3 } = useLightCard({
  light: {
    color: 'yellow'
  }
})
const { cardRef: cardRef4 } = useLightCard({
  light: {
    color: 'blue'
  }
})

const screenshot = async () => {
  window.electron.ipcRenderer.send('screenshot')
}

const recordingConfigRef = ref()
const confirm = (value) => {
  myLocalStorage.setStorage('recordingConfig', value)
}
const recordingConfig = async () => {
  recordingConfigRef.value.show()
}

const isRecording = ref(false)
const notification = ref<NotificationHandle | null>(null)
const startRecording = async () => {
  if (isRecording.value) return
  isRecording.value = true
  let recordingConfig = myLocalStorage.getStorage('recordingConfig')
  if (!recordingConfig) {
    ElMessage({
      type: 'warning',
      message: '请先填写录屏配置'
    })
    return
  }
  window.electron.ipcRenderer.send('startRecording', recordingConfig)
}

const recordingLogRef = ref()
const recordingLog = ref<string[]>([])
window.electron.ipcRenderer.on('recording', (_, data) => {
  recordingLog.value.push(data)
  nextTick(() => {
    recordingLogRef.value.scrollTop = recordingLogRef.value.scrollHeight
  })

  if (!notification.value) {
    notification.value = ElNotification({
      title: '开始录屏',
      type: 'info',
      message: h('div', { style: 'color: teal' }, '正在录制中...'),
      showClose: false,
      duration: 0,
      position: 'bottom-right'
    })
  }
})
const stopRecording = async () => {
  if (!isRecording.value) return
  isRecording.value = false
  window.electron.ipcRenderer.send('stopRecording')
}
window.electron.ipcRenderer.on('recording-exit', () => {
  if (notification.value) {
    notification.value.close()
    notification.value = null
  }
  let recordingConfig = JSON.parse(localStorage.getItem('recordingConfig')!)
  ElNotification({
    title: '录制完成',
    type: 'success',
    message: h('div', { style: 'width:100%;' }, [
      h('span', { style: 'color: teal; margin-left: -30px;' }, '录制完成，请打开保存目录查看'),
      h(
        ElTag,
        {
          type: 'success',
          style: 'width: 290px; margin-left: -30px; overflow: hidden; cursor: pointer;',
          onClick: () => openSavePath(recordingConfig.saveDir)
        },
        () => recordingConfig.saveDir
      )
    ]),
    duration: 0,
    position: 'bottom-right'
  })
})

const openSavePath = async (path) => {
  const res = await window.electron.ipcRenderer.invoke('open-dir', path)
  ElMessage({
    message: res.message,
    type: res.isExist ? 'success' : 'error'
  })
}

const video = async () => {}
const audio = async () => {}
</script>

<style lang="less" scoped>
.screen {
  .card:hover {
    box-shadow: var(--el-box-shadow-light);
  }
  .card {
    box-sizing: border-box;
    height: 120px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    border: 1px solid #e4e7ed;
    border-radius: 4px;
    margin-right: 10px;

    h3 {
      margin: 0;
    }

    .header {
      flex: 1;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #e4e7ed;
      padding: 18px 20px;

      .more {
        display: flex;
        align-items: center;
      }
    }

    .content {
      flex: 1;
      padding: 18px 20px;
      display: flex;
      justify-content: space-between;
    }
  }

  .recording-log {
    position: relative;
    width: calc(100vw - 167px);
    height: calc(100vh - 280px);
    border-radius: 3px;
    margin-top: 20px;
    padding: 10px;
    overflow: auto;
    background-color: black;
    font-weight: 300;
    color: rgb(180, 174, 174);
    .close {
      position: sticky;
      top: 0;
      left: calc(100vw - 167px);
      cursor: pointer;
    }
    .log-item {
      padding-bottom: 15px;
    }
  }
}
</style>
