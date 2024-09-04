<template>
  <div class="crawler">
    <el-card class="box-card">
      <el-button type="primary" :disabled="spiderStatus" @click="showDialog">添加网址</el-button>
      <el-button type="primary" :disabled="tableData.length === 0 || spiderStatus" @click="getPages"
        >爬取</el-button
      >
      <span v-if="savePath">
        <el-tag class="save-path" @click="openSavePath(savePath)">保存路径：{{ savePath }}</el-tag>
        <el-tag class="select-path" @click="selectDir"
          ><el-icon><Edit /></el-icon
        ></el-tag>
      </span>
      <el-table :data="tableData" height="calc(100vh - 150px)">
        <el-table-column align="center" prop="address" label="网址" show-overflow-tooltip />
        <el-table-column align="center" prop="css" label="样式表">
          <template #default="scope">
            <el-progress type="dashboard" :width="50" :percentage="scope.row.css" />
          </template>
        </el-table-column>
        <el-table-column align="center" prop="js" label="脚本">
          <template #default="scope">
            <el-progress type="dashboard" :width="50" :percentage="scope.row.js" />
          </template>
        </el-table-column>
        <el-table-column align="center" prop="img" label="图片">
          <template #default="scope">
            <el-progress type="dashboard" :width="50" :percentage="scope.row.img" />
          </template>
        </el-table-column>
        <el-table-column align="center" label="操作">
          <template #default="scope">
            <el-tag v-if="scope.row.css === 100 && scope.row.js === 100 && scope.row.img === 100">
              已完成
            </el-tag>
            <el-tag v-else-if="scope.row.fail" type="danger"> 出错了 </el-tag>
            <el-button v-else-if="scope.row.isPause" type="primary" @click="start(scope.row)"
              >继续</el-button
            >
            <el-button v-else type="danger" @click="pause(scope.row)">暂停</el-button>
          </template>
        </el-table-column>
      </el-table>
      <CrawlerDialog ref="crawlerDialogRef" @confirm="confirm"> </CrawlerDialog>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CrawlerDialog from './cps/CrawlerDialog.vue'
import { IProgress, SpiderOptions } from '../../../../../types/spider.type'
import { myLocalStorage } from '@renderer/utils/storage'

const crawlerDialogRef = ref<any>()
const tableData = ref<any[]>([])
const savePath = ref<string>()
const headless = ref<boolean>()
const spiderStatus = ref<boolean>(false)
const confirm = (value) => {
  savePath.value = value.savePath
  headless.value = value.headless
  tableData.value = value.address.map((item) => ({
    address: item,
    css: 0,
    js: 0,
    img: 0,
    isPause: true,
    fail: false
  }))
}

const start = (row) => {
  row.isPause = false
  window.electron.ipcRenderer.send('operate_spider', { type: 'start', url: row.address })
}

const pause = (row) => {
  row.isPause = true
  window.electron.ipcRenderer.send('operate_spider', { type: 'pause', url: row.address })
}

const emit = defineEmits(['setChromePath'])
const getPages = async () => {
  spiderStatus.value = true
  let chromePath = myLocalStorage.getStorage('chromePath')
  if (!chromePath) {
    const res = await window.electron.ipcRenderer.invoke('get-chrome-path')
    chromePath = res.path
  }
  if (!chromePath) {
    emit('setChromePath')
    spiderStatus.value = false
    return
  }

  tableData.value.forEach((row) => {
    row.isPause = false
  })
  const urls = tableData.value.map((row) => row.address)
  const options: SpiderOptions = {
    urls,
    savePath: savePath.value!,
    headless: headless.value!,
    chromePath
  }
  window.electron.ipcRenderer.send('start', options)
}

window.electron.ipcRenderer.on('progress', (_, progressInfo: IProgress) => {
  console.log(progressInfo)

  const [address, resourceType] = progressInfo.type_progress.split('_')
  tableData.value.forEach((row) => {
    if (row.address === address) {
      row[resourceType] = progressInfo.progress
    }
  })
})

window.electron.ipcRenderer.on('finish', (_, { type, status, url }) => {
  if (type === 'all') {
    spiderStatus.value = false
  } else if (type === 'single') {
    const row = tableData.value.find((row) => row.address === url)
    row.fail = status === 'fail'
    if (status === 'success') {
      row.css = 100
      row.js = 100
      row.img = 100
    }
  }
})

const selectDir = async () => {
  const dir = await window.electron.ipcRenderer.invoke('selectDir')
  savePath.value = dir
}

const openSavePath = async (path) => {
  const res = await window.electron.ipcRenderer.invoke('open-dir', path)
  ElMessage({
    message: res.message,
    type: res.isExist ? 'success' : 'error'
  })
}

const showDialog = () => {
  crawlerDialogRef.value.show()
}
</script>

<style lang="less" scoped>
.save-path,
.select-path {
  margin-left: 10px;
  cursor: pointer;
}
</style>
