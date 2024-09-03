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

const startRecording = () => {
  window.electron.ipcRenderer.send('recording-start')
}

const stopRecording = () => {
  window.electron.ipcRenderer.send('main-recording-stop')
}

const trayMenu = ref<TrayMenuItem[]>([
  {
    label: '开始录屏',
    shortcutKey: 'Ctrl+R',
    icon: 'Camera',
    click: startRecording
  },
  {
    label: '停止录屏',
    shortcutKey: 'Ctrl+T',
    icon: 'VideoPause',
    disabled: true,
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
</script>

<style scoped lang="less">
.tray-menu {
  background-color: #fff;
  border-radius: 10px;
  overflow: hidden;

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
