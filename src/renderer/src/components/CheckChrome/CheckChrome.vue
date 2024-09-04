<template>
  <el-dialog v-model="visible" width="500">
    <template #header>
      <div class="header">
        <el-icon size="20px" color="#e6a23c"><WarningFilled /></el-icon>
        <span class="title">警告 !</span>
      </div>
    </template>
    <div style="padding-left: 20px">
      检测到您没有安装chrome，以下模块将无法使用，是否进行下载安装?
    </div>
    <ul>
      <li>爬虫</li>
      <li>模拟浏览器</li>
    </ul>
    <el-input
      v-model="chromePath"
      style="margin-left: 20px; width: 93%"
      placeholder="如果您已安装，请选择 chrome.exe 安装路径"
      disabled
    >
      <template #append>
        <el-button @click="selectDir">选择</el-button>
      </template>
    </el-input>
    <template #footer>
      <div class="dialog-footer">
        <el-button text type="danger" @click="closeNotify">不再提示</el-button>
        <el-button v-if="chromePath" type="primary" text @click="savePath">保存</el-button>
        <el-button
          v-else
          type="primary"
          text
          :loading="downloadStatus === Status.downloading"
          @click="download"
          >{{
            downloadStatus === Status.notDownload
              ? '立即安装'
              : downloadStatus === Status.downloading
                ? '正在下载'
                : '下载完成'
          }}</el-button
        >
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { myLocalStorage } from '@renderer/utils/storage'

enum Status {
  notDownload = 'notDownload',
  downloading = 'downloading',
  downloaded = 'downloaded'
}

const visible = ref(false)
const downloadStatus = ref(Status.notDownload)
const chromePath = ref()

window.electron.ipcRenderer.invoke('get-chrome-path').then((res) => {
  if (!res.path) {
    if (!myLocalStorage.getStorage('chromePath') && !myLocalStorage.getStorage('isCloseNotify')) {
      visible.value = true
    }
  }
})

const selectDir = async () => {
  const dir = await window.electron.ipcRenderer.invoke('selectDir')
  chromePath.value = dir + '\\chrome.exe'
}

const savePath = () => {
  myLocalStorage.setStorage('chromePath', chromePath.value)
  visible.value = false
}

const closeNotify = () => {
  visible.value = false
  myLocalStorage.setStorage('isCloseNotify', true)
}

const download = async () => {
  if (downloadStatus.value !== Status.notDownload) return
  downloadStatus.value = Status.downloading
  const res = await window.electron.ipcRenderer.invoke('download-chrome')
  if (res.code === 0) {
    ElMessage.success(res.message)
    downloadStatus.value = Status.downloaded
  } else {
    ElMessage.error(res.message)
    downloadStatus.value = Status.notDownload
  }
}

const show = () => {
  visible.value = true
}

defineExpose({ show })
</script>

<style scoped lang="less">
.header {
  display: flex;
  align-items: center;
  .title {
    margin-left: 10px;
    font-size: 20px;
    font-weight: 700;
  }
}
</style>
