<template>
  <div class="personal">
    <el-card style="height: calc(100vh - 80px)">
      <template v-if="visitor">
        <h2>游客模式</h2>
        <p>
          当前为游客模式，该模式下无法保存相关配置，试试
          <el-button type="primary" link @click="router.push('/login')">登录</el-button> ?
        </p>
        <el-button type="primary" link @click="router.push('/login')">去登录</el-button>
        <el-button type="primary" link @click="router.push('/')">继续游览</el-button>
        <el-button type="primary" link :loading="checkStatus" @click="checkUpdate"
          >检测更新</el-button
        >
      </template>
      <el-tabs v-else tab-position="left" style="height: calc(100vh - 120px)">
        <el-tab-pane label="个人信息"> <UserInfo /></el-tab-pane>
        <el-tab-pane label="设置"><Setting /> </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import UserInfo from './cps/UserInfo.vue'
import Setting from './cps/Setting.vue'
import { myLocalStorage } from '@renderer/utils/storage'
import { useRouter } from 'vue-router'
import useCheckUpdate from '@renderer/hooks/useCheckUpdate'

const visitor = myLocalStorage.getStorage('visitor')
const router = useRouter()
const { checkStatus } = useCheckUpdate()
const checkUpdate = () => window.electron.ipcRenderer.send('checking-for-update')
</script>
