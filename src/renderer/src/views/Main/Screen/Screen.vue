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
            <div class="header" @click="showRecordingConfig">
              <h3>录屏</h3>
              <span class="more">
                更多<el-icon><ArrowRight /></el-icon>
              </span>
            </div>
            <div class="content">
              <el-icon @click="startRecording"><Camera /></el-icon>
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
    </el-card>
    <RecordingConfig ref="recordingConfigRef" @confirm="confirm"></RecordingConfig>
  </div>
</template>

<script setup lang="ts">
import { useLightCard } from '@renderer/hooks/use-light-card'
import RecordingConfig from './cps/RecordingConfig.vue'
import { myLocalStorage } from '@renderer/utils/storage'
import { useRoute } from 'vue-router'

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
const showRecordingConfig = async () => {
  recordingConfigRef.value.show()
}

const route = useRoute()
watch(
  () => route.query,
  (newVal) => {
    if (newVal.id) {
      nextTick(() => {
        recordingConfigRef.value.show()
      })
    }
  },
  { immediate: true }
)

const startRecording = async () => {
  window.electron.ipcRenderer.send('recording-start')
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
