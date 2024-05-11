<template>
  <div class="crawler">
    <el-card class="box-card">
      <el-button type="primary" @click="showDialog">添加网址</el-button>
      <el-button type="primary" @click="start" :disabled="tableData.length === 0">爬取</el-button>
      <el-table :data="tableData" height="calc(100vh - 150px)">
        <el-table-column align="center" prop="address" label="网址" show-overflow-tooltip />
        <el-table-column align="center" prop="style" label="样式表">
          <template #default="scope">
            <el-progress type="dashboard" :width="50" :percentage="scope.row.style" />
          </template>
        </el-table-column>
        <el-table-column align="center" prop="script" label="脚本">
          <template #default="scope">
            <el-progress type="dashboard" :width="50" :percentage="scope.row.script" />
          </template>
        </el-table-column>
        <el-table-column align="center" prop="image" label="图片">
          <template #default="scope">
            <el-progress type="dashboard" :width="50" :percentage="scope.row.image" />
          </template>
        </el-table-column>
        <el-table-column align="center" label="操作">
          <template #default="scope">
            <el-tag
              v-if="scope.row.style === 100 && scope.row.script === 100 && scope.row.image === 100"
            >
              已完成
            </el-tag>
            <el-button type="primary" v-else-if="scope.row.isPause" @click="goOn(scope.row)"
              >继续</el-button
            >
            <el-button type="danger" v-else @click="pause(scope.row)">暂停</el-button>
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

const crawlerDialogRef = ref<any>()
const tableData = ref<any[]>([])
const confirm = (value) => {
  tableData.value = value.address.map((item) => ({
    address: item,
    style: 10,
    script: 10,
    image: 10,
    isPause: true
  }))
}

const add = (obj, key, timeout) => {
  if (obj[key] >= 100) return
  const timer = setInterval(() => {
    if (obj[key] >= 100 || obj.isPause) {
      clearInterval(timer)
      return
    }
    obj[key]++
  }, timeout)
}

const goOn = (row) => {
  row.isPause = false
  add(row, 'style', 10)
  add(row, 'script', 20)
  add(row, 'image', 30)
}

const pause = (row) => {
  row.isPause = true
}

const start = () => {
  tableData.value.forEach((row) => {
    row.isPause = false
    add(row, 'style', 10)
    add(row, 'script', 20)
    add(row, 'image', 30)
  })
}

const showDialog = () => {
  crawlerDialogRef.value.show()
}
</script>

<style lang="less" scoped></style>
