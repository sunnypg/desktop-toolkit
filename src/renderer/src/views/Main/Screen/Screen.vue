<template>
  <div class="screen">
    <el-card style="height: calc(100vh - 80px)">
      <el-row>
        <el-col :span="6">
          <div class="card" ref="cardRef1" @click="screenshot">
            <el-card>
              <template #header> 截屏 </template>
              <el-icon><Scissor /></el-icon>
            </el-card>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="card" ref="cardRef2" @click="record">
            <el-card>
              <template #header> 录屏 </template>
              <el-icon><Camera /></el-icon>
            </el-card>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="card" ref="cardRef3" @click="video">
            <el-card>
              <template #header> 录像 </template>
              <el-icon><VideoCamera /></el-icon>
            </el-card>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="card" ref="cardRef4" @click="audio">
            <el-card>
              <template #header> 录音 </template>
              <el-icon><Microphone /></el-icon>
            </el-card>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useLightCard } from '@renderer/hooks/use-light-card'

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
const record = async () => {}
const video = async () => {}
const audio = async () => {}
</script>

<style lang="less" scoped>
.screen {
  .card {
    cursor: pointer;
  }
}
</style>
