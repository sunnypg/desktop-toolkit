<template>
  <el-descriptions title="系统配置" :column="1">
    <el-descriptions-item label="chrome：">
      <el-input v-model="chromePath" placeholder="请选择chrome路径" disabled style="width: 30%">
        <template #append>
          <el-button @click="selectChromePath">选择</el-button>
        </template>
      </el-input>
    </el-descriptions-item>
  </el-descriptions>
  <el-descriptions title="爬虫配置" :column="1">
    <el-descriptions-item label="存储路径：">
      <el-input
        v-model="crawlerConfig.savePath"
        placeholder="请选择存储路径"
        disabled
        style="width: 30%"
      >
        <template #append>
          <el-button @click="selectDir(crawlerConfig, 'savePath')">选择</el-button>
        </template>
      </el-input>
    </el-descriptions-item>
    <el-descriptions-item label="无头模式：">
      <el-switch v-model="crawlerConfig.headless"></el-switch>
    </el-descriptions-item>
  </el-descriptions>
  <el-descriptions title="录屏配置" :column="1">
    <el-descriptions-item v-for="item in data" :key="item.label" :label="`${item.label}：`">
      <el-select
        v-model="recordingConfig[item.prop]"
        :placeholder="item.placeholder"
        style="width: 30%"
      >
        <el-option
          v-for="option in item.options"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
    </el-descriptions-item>
    <el-descriptions-item label="存放目录：">
      <el-input
        v-model="recordingConfig.saveDir"
        placeholder="请选择存放目录"
        disabled
        style="width: 30%"
      >
        <template #append>
          <el-button @click="selectDir(recordingConfig, 'saveDir')">选择</el-button>
        </template>
      </el-input>
    </el-descriptions-item>
  </el-descriptions>
  <div style="margin-left: 25px">
    <el-button type="primary" @click="saveConfig">保存</el-button>
  </div>
</template>

<script setup lang="ts">
import { myLocalStorage } from '@renderer/utils/storage'

const data = ref([
  {
    label: '分辨率',
    prop: 'definition',
    placeholder: '请选择分辨率',
    options: [
      { label: '100%', value: 1 },
      { label: '75%', value: 0.75 },
      { label: '50%', value: 0.5 },
      { label: '25%', value: 0.25 }
    ]
  },
  {
    label: '帧率',
    prop: 'fps',
    placeholder: '请选择帧率',
    options: [
      { label: '高', value: '60' },
      { label: '中', value: '30' },
      { label: '低', value: '15' }
    ]
  },
  {
    label: '另存为',
    prop: 'type',
    placeholder: '请选择保存类型',
    options: [
      { label: 'webm', value: 'webm' },
      { label: 'mp4', value: 'mp4' },
      { label: 'gif', value: 'gif' }
    ]
  }
])

window.electron.ipcRenderer.invoke('screen_size').then((res) => {
  data.value[0].options = data.value[0].options.map((option) => {
    return {
      label: `${option.label}（${res.width * option.value}x${res.height * option.value}）`,
      value: option.value
    }
  })
})

interface IRecordingConfig {
  definition: number
  fps: string
  type: string
  saveDir: string
}
interface ICrawlerConfig {
  savePath: string
  headless: boolean
}

const recordingConfig = ref<IRecordingConfig>(myLocalStorage.getStorage('recordingConfig') || {})
const crawlerConfig = ref<ICrawlerConfig>(myLocalStorage.getStorage('crawlerConfig') || {})
const chromePath = ref(myLocalStorage.getStorage('chromePath') || '')

const selectDir = async (target, key) => {
  const dir = await window.electron.ipcRenderer.invoke('selectDir')
  target[key] = dir
}

const selectChromePath = async () => {
  const path = await window.electron.ipcRenderer.invoke('selectDir')
  chromePath.value = path + '\\chrome'
}

const saveConfig = () => {
  myLocalStorage.setStorage('chromePath', chromePath.value)
  myLocalStorage.setStorage('crawlerConfig', crawlerConfig.value)
  myLocalStorage.setStorage('recordingConfig', recordingConfig.value)
  ElMessage.success('保存成功')
}
</script>

<style scoped lang="less">
:deep(.el-descriptions__label) {
  display: inline-block;
  width: 80px;
  text-align: right;
}
</style>
