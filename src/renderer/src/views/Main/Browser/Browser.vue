<template>
  <div class="browser">
    <el-card class="box-card">
      <el-button type="primary" @click="showAdd">新建浏览器</el-button>
      <el-table :data="tableData" height="calc(100vh - 150px)">
        <el-table-column align="center" prop="id" label="ID" show-overflow-tooltip />
        <el-table-column align="center" prop="name" label="名称" show-overflow-tooltip />
        <el-table-column align="center" prop="note" label="备注" />
        <el-table-column align="center" prop="userAgent" label="User Agent" show-overflow-tooltip />
        <el-table-column align="center" label="操作" width="150">
          <template #default="{ row }">
            <el-button
              :type="row.isOpen ? 'danger' : 'primary'"
              icon="ChromeFilled"
              :loading="row.loading"
              @click="openOrClose(row)"
            >
              {{ row.isOpen ? '关闭' : '打开' }}</el-button
            >
            <el-dropdown>
              <span class="el-dropdown-link">
                <el-icon><MoreFilled /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="showEdit(row)"
                    ><el-button type="primary" link icon="Edit"></el-button
                  ></el-dropdown-item>
                  <el-dropdown-item @click="remove(row)"
                    ><el-button type="primary" link icon="delete"></el-button
                  ></el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
      <AddDialog ref="addDialogRef" @confirm="confirm" />
      <EditDialog ref="editDialogRef" @confirm="confirm" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AddDialog from './cps/AddDialog.vue'
import EditDialog from './cps/EditDialog.vue'
import { IBrowser } from '../../../../../types/browser.type'
import { myLocalStorage } from '@renderer/utils/storage'

const addDialogRef = ref()
const editDialogRef = ref()
const tableData = ref<any[]>(
  localStorage.getItem('browserList') ? JSON.parse(localStorage.getItem('browserList')!) : []
)

const confirm = (value) => {
  value.proxyUrl =
    value.proxy_type !== 'NoProxy'
      ? `${value.proxy_type}://${value.username}:${value.password}@${value.host}:${value.port}`
      : ''
  if (value.id) {
    for (let i = 0; i < tableData.value.length; i++) {
      if (tableData.value[i].id === value.id) {
        tableData.value[i] = value
        break
      }
    }
  } else {
    tableData.value.unshift({ id: crypto.randomUUID(), ...value, isOpen: false })
  }
  localStorage.setItem('browserList', JSON.stringify(tableData.value))
}

const remove = (row) => {
  ElMessageBox.confirm('您确定删除吗?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      tableData.value = tableData.value.filter((item) => item.id !== row.id)
      window.electron.ipcRenderer.invoke('removeDir', row.userDataDir)
      localStorage.setItem('browserList', JSON.stringify(tableData.value))
      ElMessage({
        type: 'success',
        message: '删除成功!'
      })
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '取消操作!'
      })
    })
}

const emit = defineEmits(['setChromePath'])
const openOrClose = async (row) => {
  row.loading = true
  let chromePath = myLocalStorage.getStorage('chromePath')
  if (!chromePath) {
    const res = await window.electron.ipcRenderer.invoke('get-chrome-path')
    chromePath = res.path
    console.log(chromePath)
  }
  if (!chromePath) {
    emit('setChromePath')
    row.loading = false
    return
  }

  const options: IBrowser = {
    id: row.id,
    name: row.name,
    chromePath: chromePath,
    note: row.note,
    system: row.system,
    UA: row.UA,
    userAgent: row.userAgent,
    userDataDir: row.userDataDir,
    proxyUrl: row.proxyUrl,
    disable_webgl: row.disable_webgl,
    webgl_mode: row.webgl_mode,
    urls: row.urls?.split('\n').map((item) => item.trim()) || [],
    bookmarks: row.bookmarks?.map((item) => ({ title: item.title, url: item.url }))
  }
  const original_status = row.isOpen

  await window.electron.ipcRenderer.invoke(row.isOpen ? 'close' : 'open', options)
  row.loading = false
  row.isOpen = !original_status
}

window.electron.ipcRenderer.on('disconnected', (_, { id, urls }) => {
  const self = tableData.value.find((item) => item.id === id)
  self.urls = urls.join('\n')
  self.isOpen = false
  self.loading = false
  localStorage.setItem('browserList', JSON.stringify(tableData.value))
})

const showAdd = () => {
  addDialogRef.value.show()
}
const showEdit = (row) => {
  editDialogRef.value.show(row)
}
</script>

<style lang="less" scoped>
.el-dropdown-link {
  margin: 6px 0 0 20px;
}
</style>
