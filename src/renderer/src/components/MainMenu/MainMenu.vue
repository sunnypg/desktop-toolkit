<template>
  <div class="main-menu">
    <img class="logo" src="../../assets/images/logo.png" alt="" />
    <div class="menu">
      <el-menu
        :default-active="defaultActive"
        :collapse="true"
        text-color="#8f95b2"
        active-text-color="#6c5dd3"
      >
        <template v-for="(item, index) in menuList">
          <el-menu-item
            :index="`${index}`"
            @click="handleItemClick({ url: item.path, index: `${index}` })"
          >
            <el-icon>
              <svg-icon v-if="item.iconType === 'custom'" :iconName="item.iconName"></svg-icon>
              <Component v-else :is="item.icon"></Component>
            </el-icon>
            <template #title>{{ item.title }}</template>
          </el-menu-item>
        </template>
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
import menuList from './menu'

const defaultActive = localStorage.getItem('defaultActive') || ''

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
    width: 35px;
    margin: 5px 0 0 9px;
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
