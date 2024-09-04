<template>
  <div class="main">
    <el-container class="main-content">
      <el-aside width="55px">
        <MainMenu />
      </el-aside>
      <el-container>
        <el-header height="35px"> </el-header>
        <el-main>
          <router-view v-slot="{ Component }">
            <keep-alive>
              <component :is="Component" @set-chrome-path="() => checkChromeRef?.show()" />
            </keep-alive>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
    <check-chrome ref="checkChromeRef" />
  </div>
</template>

<script setup lang="ts">
import CheckChrome from '@renderer/components/CheckChrome/CheckChrome.vue'

const checkChromeRef = ref<InstanceType<typeof CheckChrome>>()
</script>

<style lang="less" scoped>
.main {
  width: 100%;
  height: 100%;
}

.main-content {
  height: 100%;

  .el-aside {
    scrollbar-width: none; /* firefox */
    -ms-overflow-style: none; /* IE 10+ */
    &::-webkit-scrollbar {
      display: none;
    }
  }

  .el-main {
    background-color: #f0f2f5;
  }
}
</style>
