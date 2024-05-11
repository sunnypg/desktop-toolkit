<template>
  <div class="main-menu">
    <img class="logo" src="../../assets/images/logo.jpg" alt="" />
    <div class="menu">
      <el-menu
        :default-active="defaultActive"
        :collapse="true"
        text-color="#8f95b2"
        active-text-color="#6c5dd3"
      >
        <el-menu-item index="1" @click="handleItemClick({ url: '/main/crawler', index: '1' })">
          <el-icon><CrawlerIcon /></el-icon>
          <template #title>爬虫</template>
        </el-menu-item>
        <el-menu-item index="2" @click="handleItemClick({ url: '/main/setting', index: '2' })">
          <el-icon><Setting /></el-icon>
          <template #title>设置</template>
        </el-menu-item>
      </el-menu>
    </div>
    <div class="info">
      <el-dropdown>
        <el-avatar class="avatar" :size="30" :src="avatar" />
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>
              <el-icon><CircleCloseFilled /></el-icon>
              退出系统
            </el-dropdown-item>
            <el-dropdown-item>
              <el-icon><InfoFilled /></el-icon>
              个人信息
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import router from '@renderer/router'
import avatar from '@renderer/assets/images/avatar.jpg'
import { ElMessage, ElMessageBox } from 'element-plus'

const defaultActive = localStorage.getItem('defaultActive')

function handleItemClick(item: any) {
  router.push(item.url)
  localStorage.setItem('defaultActive', item.index)
}
</script>

<style lang="less" scoped>
.main-menu {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;

  .logo {
    width: 40px;
    margin-left: 8px;
  }

  .info {
    line-height: normal;
    position: fixed;
    bottom: 20px;
    left: 6px;

    .avatar {
      margin-left: 6px;
      cursor: pointer;
    }
  }
}
</style>
