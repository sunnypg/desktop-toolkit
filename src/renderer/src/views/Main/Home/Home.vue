<template>
  <div class="home">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <h3><svg-icon iconName="icon-CPU"></svg-icon> CPU</h3>
          </template>
          <el-table :data="data.cpu" v-if="data.cpu">
            <el-table-column prop="property" label="属性" />
            <el-table-column label="值" width="300">
              <template #default="{ row }">
                <template v-if="row.property === '核心数'">
                  {{ row.value }}
                </template>
                <el-progress
                  v-else
                  :color="row.property !== '当前空闲率' ? getColor(row.value) : '#409EFF'"
                  :percentage="row.value"
                />
              </template>
            </el-table-column>
          </el-table>
          <el-skeleton v-else :rows="5" animated />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <h3><svg-icon iconName="icon-neicun"></svg-icon> 内存</h3>
          </template>
          <el-table :data="data.mem" v-if="data.mem">
            <el-table-column prop="property" label="属性" />
            <el-table-column label="值" width="300">
              <template #default="{ row }">
                <el-progress
                  v-if="row.property === '使用率'"
                  :color="getColor(row.value)"
                  :percentage="row.value"
                />
                <template v-else>
                  {{ row.value }}
                </template>
              </template>
            </el-table-column>
          </el-table>
          <el-skeleton v-else :rows="5" animated />
        </el-card>
      </el-col>
      <el-col :span="24">
        <el-card>
          <template #header>
            <h3><svg-icon iconName="icon--diannao"></svg-icon> 服务器信息</h3>
          </template>
          <el-descriptions :column="4" v-if="data.sys">
            <el-descriptions-item label="主机名">{{
              data?.sys?.computerName
            }}</el-descriptions-item>
            <el-descriptions-item label="IP">{{ data?.sys?.computerIp }}</el-descriptions-item>
            <el-descriptions-item label="操作系统">{{ data?.sys?.osName }}</el-descriptions-item>
            <el-descriptions-item label="系统架构">{{ data?.sys?.osArch }}</el-descriptions-item>
          </el-descriptions>
          <el-skeleton v-else :rows="1" animated />
        </el-card>
      </el-col>
      <el-col :span="24">
        <el-card>
          <template #header>
            <h3><svg-icon iconName="icon-cipan"></svg-icon> 磁盘</h3>
          </template>
          <el-table :data="data.disk" v-if="data.disk">
            <el-table-column label="盘符路径" width="120">
              <template #default="{ row }">
                {{ row.dirName + '\\' }}
              </template>
            </el-table-column>
            <el-table-column label="盘符类型">
              <template #default="{ row }">
                {{ `${row.typeName} (${row.dirName})` }}
              </template>
            </el-table-column>
            <el-table-column prop="total" label="总大小" />
            <el-table-column prop="used" label="已用大小" />
            <el-table-column prop="free" label="可用大小" />
            <el-table-column prop="usage" label="已用百分比" width="300">
              <template #default="{ row }">
                <el-progress :color="getColor(row.usage)" :percentage="row.usage" />
              </template>
            </el-table-column>
          </el-table>
          <el-skeleton v-else :rows="5" animated />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
const data = ref<any>({})
window.electron.ipcRenderer.invoke('system_info').then((res) => {
  data.value = res
})

const getColor = (value) => {
  if (value >= 80) {
    return '#F56C6C'
  } else if (value >= 50) {
    return '#E6A23C'
  }
  return '#409EFF'
}
</script>

<style lang="less" scoped>
h3 {
  margin: 0;
}

.el-col {
  margin-bottom: 10px;
}
</style>
