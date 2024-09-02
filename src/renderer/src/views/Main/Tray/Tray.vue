<template>
  <div class="tray-menu">
    <div v-for="item in trayMenu" :key="item.label" class="tray-menu-item" @click="item.click">
      <el-button :type="item.type || 'default'" text class="item-btn" :disabled="item.disabled">
        <el-icon>
          <svg-icon v-if="item.iconType === 'custom'" :icon-name="item.iconName!"></svg-icon>
          <Component :is="item.icon"></Component>
        </el-icon>
        <span>
          {{ item.label }}
          <span class="shortcut-key">{{ item.shortcutKey }}</span>
        </span>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { myLocalStorage } from '@renderer/utils/storage'

interface TrayMenuItem {
  label: string
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  shortcutKey?: string
  iconType?: string
  iconName?: string
  icon?: string
  disabled?: boolean
  click: () => void
}

window.electron.ipcRenderer.on('reload', () => {
  trayMenu.value.forEach((item) => {
    if (item.label === '开始录屏') {
      item.disabled = !myLocalStorage.getStorage('recordingConfig')
    }
    if (item.label === '停止录屏') {
      item.disabled = true
    }
  })
})

window.electron.ipcRenderer.on('recording', () => {
  trayMenu.value.forEach((item) => {
    if (item.label === '开始录屏') {
      item.disabled = true
    }
    if (item.label === '停止录屏') {
      item.disabled = false
    }
  })
})

window.electron.ipcRenderer.on('recording-exit', () => {
  trayMenu.value.forEach((item) => {
    if (item.label === '开始录屏') {
      item.disabled = false
    }
    if (item.label === '停止录屏') {
      item.disabled = true
    }
  })
})

const startRecording = () => {
  let recordingConfig = myLocalStorage.getStorage('recordingConfig')
  if (!recordingConfig) return
  window.electron.ipcRenderer.send('startRecording', recordingConfig)
}
window.electron.ipcRenderer.on('shortcut-start-recording', startRecording)

const stopRecording = () => {
  window.electron.ipcRenderer.send('stopRecording')
}
window.electron.ipcRenderer.on('shortcut-stop-recording', stopRecording)

const trayMenu = ref<TrayMenuItem[]>([
  {
    label: '开始录屏',
    shortcutKey: 'Ctrl+R',
    icon: 'Camera',
    disabled: !myLocalStorage.getStorage('recordingConfig'),
    click: startRecording
  },
  {
    label: '停止录屏',
    shortcutKey: 'Ctrl+T',
    icon: 'VideoPause',
    disabled: !myLocalStorage.getStorage('recordingConfig'),
    click: stopRecording
  },
  {
    label: '截图',
    shortcutKey: 'Ctrl+Q',
    icon: 'Scissor',
    click: () => window.electron.ipcRenderer.send('screenshot')
  },
  {
    label: '退出',
    type: 'danger',
    icon: 'SwitchButton',
    click: () => window.electron.ipcRenderer.send('exit')
  }
])
</script>

<style scoped lang="less">
.tray-menu-item {
  .item-btn {
    width: 100%;
    border-radius: 0;
    display: block;
    text-align: left;

    .shortcut-key {
      font-size: 12px;
    }
  }
}
</style>
