<template>
  <div class="main-controller">
    <span @click="reload">
      <el-icon><Refresh /></el-icon>
    </span>
    <span @click="minimize">
      <el-icon><Minus /></el-icon>
    </span>
    <span v-if="!isMax" @click="maximize">
      <el-icon><FullScreen /></el-icon>
    </span>
    <span v-if="isMax" @click="restore">
      <el-icon><Connection /></el-icon>
    </span>
    <span class="last" @click="close">
      <el-icon><Close /></el-icon>
    </span>
  </div>
</template>

<script setup lang="ts">
const isMax = ref(false)
function reload() {
  window.electron.ipcRenderer.send('reload')
}
function minimize() {
  window.electron.ipcRenderer.send('minimize')
}
function maximize() {
  window.electron.ipcRenderer.send('maximize')
}
function restore() {
  window.electron.ipcRenderer.send('restore')
}
function close() {
  window.electron.ipcRenderer.send('close')
}
window.onresize = async () => {
  isMax.value = await window.electron.ipcRenderer.invoke('isMaximized')
}
</script>

<style lang="less" scoped>
.main-controller {
  -webkit-app-region: drag;
  -webkit-user-select: none;
  position: fixed;
  top: 0;
  right: 0;
  line-height: 35px;
  display: flex;
  justify-content: space-between;
  span {
    cursor: pointer;
    -webkit-app-region: no-drag;
    display: block;
    width: 50px;
    text-align: center;
    &:hover {
      background-color: #ccc;
    }
    &:last-child:hover {
      background-color: #e81123;
      color: #fff;
    }
  }
}
</style>
