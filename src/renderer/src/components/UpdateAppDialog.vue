<template>
  <el-dialog v-model="updateDialogVisible" width="35%" :show-close="false">
    <template #header="{ titleId, titleClass }">
      <div :id="titleId" :class="titleClass">
        <SvgIcon icon-name="icon-huojian" class="icon-huojian"></SvgIcon>
        <span class="title">更新提示</span>
      </div>
    </template>
    <div class="update-info">
      <div class="message">{{ updateInfo?.msg }}</div>
      <template v-if="updateInfo?.event === 'update-available'">
        <div class="message">
          当前版本：<span style="font-weight: 700">{{ `v${version}` }}</span>
        </div>
        <div class="message">
          最新版本：<span style="font-weight: 700; color: red">{{
            `v${updateInfo?.data.version}`
          }}</span>
        </div>
        <div class="message">
          <SvgIcon icon-name="icon-caomei" class="icon-caomei"></SvgIcon>
          <span style="font-weight: 700; margin-left: 5px">更新内容</span>
          （{{ formatUTC(updateInfo?.data.releaseDate) }}）
        </div>
        <div>
          {{ updateInfo?.data.path }}（{{ formatSizeUnits(updateInfo?.data.files[0].size) }}）
        </div>
      </template>
      <template v-else-if="updateInfo?.event === 'download-progress'">
        <div class="message">
          安装包大小：{{ updateInfo?.data.total }}，下载速度：{{ updateInfo?.data.bytesPerSecond }}
        </div>
        <el-progress :stroke-width="10" :percentage="updateInfo?.data.percent" />
      </template>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button
          v-if="updateInfo?.event.includes('available')"
          :type="updateInfo?.event === 'update-not-available' ? 'primary' : ''"
          @click="updateDialogVisible = false"
          >{{ updateInfo?.event === 'update-available' ? '下次再说' : '知道了' }}
        </el-button>
        <el-button
          v-if="updateInfo?.event === 'update-available'"
          type="primary"
          @click="updateHandle('download-update')"
          >立即下载</el-button
        >
        <el-button
          v-if="updateInfo?.event === 'update-downloaded'"
          type="primary"
          @click="updateHandle('quit-and-install')"
          >立即安装</el-button
        >
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElDialog, ElProgress } from 'element-plus'
import { version } from '../../../../package.json'
import { formatUTC, formatSizeUnits } from '../utils/utils'

type UpdateHandleType = 'download-update' | 'quit-and-install'
const updateHandle = (type: UpdateHandleType) => window.electron.ipcRenderer.send(type)

const updateDialogVisible = ref(false)
const updateInfo = ref<{ data: any; msg: string; event: string }>()

window.electron.ipcRenderer.on('updater-event', (_, res) => {
  switch (res.event) {
    case 'checking-for-update':
      console.log(res)
      break
    case 'update-available':
      console.log(res)
      updateDialogVisible.value = true
      updateInfo.value = res
      break
    case 'update-not-available':
      console.log(res)
      updateDialogVisible.value = true
      updateInfo.value = res
      break
    case 'download-progress':
      console.log(res)
      updateDialogVisible.value = true
      res.data.total = formatSizeUnits(res.data.total)
      res.data.bytesPerSecond = formatSizeUnits(res.data.bytesPerSecond) + '/s'
      res.data.percent = parseFloat(res.data.percent.toFixed(2))
      updateInfo.value = res
      break
    case 'update-downloaded':
      console.log(res)
      updateDialogVisible.value = true
      updateInfo.value = res
      break
    default:
      break
  }
})
</script>

<style scoped>
.title {
  margin-left: 5px;
  font-size: 20px;
  font-weight: 700;
}

.message {
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 500;
}

.icon-huojian,
.icon-caomei {
  font-size: 20px;
}
</style>
