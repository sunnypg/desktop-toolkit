<template>
  <el-dialog v-model="dialogVisible" :title="`${form.name} 环境`" width="60%">
    <div class="dialog-from">
      <el-form
        ref="ruleFormRef"
        :model="form"
        :rules="rules"
        label-width="auto"
        style="padding-right: 10px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入名称"></el-input>
        </el-form-item>
        <el-form-item label="备注" prop="note">
          <el-input v-model="form.note" placeholder="请输入备注"></el-input>
        </el-form-item>
        <el-form-item label="用户数据" prop="userDataDir">
          <el-input v-model="form.userDataDir" placeholder="请输入用户数据目录" disabled>
            <template #append>
              <el-button @click="selectDir">选择</el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="操作系统" prop="system">
          <el-select v-model="form.system" placeholder="请选择系统" @change="onChange">
            <el-option
              v-for="item in WindowsOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="User Agent" prop="userAgent">
          <el-input
            v-model="form.userAgent"
            placeholder="请输入User Agent"
            style="max-width: 600px"
          >
            <template #prepend>
              <el-select
                v-model="form.UA"
                placeholder="请选择User Agent"
                style="width: 115px"
                @change="onChange"
              >
                <el-option
                  v-for="item in UAOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="网址" prop="urls">
          <el-input
            v-model="form.urls"
            type="textarea"
            :autosize="{ minRows: 6, maxRows: 10 }"
            placeholder="请输入网址（换行填写多个网址）"
          />
        </el-form-item>
        <el-form-item label="代理类型" prop="proxy_type">
          <el-select v-model="form.proxy_type" placeholder="请选择代理类型">
            <el-option
              v-for="item in proxyTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
              :disabled="item.disabled"
            />
          </el-select>
        </el-form-item>
        <template v-if="form.proxy_type !== 'NoProxy'">
          <el-form-item label="主机" prop="host">
            <el-input v-model="form.host" placeholder="请输入主机"></el-input>
          </el-form-item>
          <el-form-item label="端口" prop="port">
            <el-input v-model="form.port" placeholder="请输入端口"></el-input>
          </el-form-item>
          <el-form-item label="代理账号" prop="username">
            <el-input v-model="form.username" placeholder="请输入代理账号"></el-input>
          </el-form-item>
          <el-form-item label="代理密码" prop="password">
            <el-input
              v-model="form.password"
              placeholder="请输入代理密码"
              type="password"
              show-password
            ></el-input>
          </el-form-item>
        </template>
        <el-form-item label="书签" prop="bookmarks">
          <template v-for="item in bookmarks" :key="item.id">
            <el-row :gutter="10" style="width: 100%; margin-bottom: 5px">
              <el-col :span="6">
                <el-input v-model="item.title" placeholder="请输入书签标题"></el-input>
              </el-col>
              <el-col :span="17">
                <el-input v-model="item.url" placeholder="请输入书签网址"></el-input>
              </el-col>
              <el-col :span="1">
                <el-button
                  type="primary"
                  link
                  style="color: #f56c6c"
                  icon="delete"
                  @click="removeBookmark(item)"
                ></el-button>
              </el-col>
            </el-row>
          </template>
          <el-button type="primary" link icon="plus" @click="addBookmark">新增书签</el-button>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div>
        <el-button type="primary" @click="onSubmit">修改</el-button>
        <el-button type="warning" @click="onClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import { ref } from 'vue'
import { UAOptions, WindowsOptions, proxyTypes } from '../options'

const dialogVisible = ref(false)

const ruleFormRef = ref<FormInstance>()
const form = ref<any>({
  name: null,
  note: null,
  urls: null,
  userDataDir: null,
  system: 'Windows NT 10.0',
  UA: '122.0.6261.112',
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.112 Safari/537.36',
  proxy_type: 'NoProxy',
  host: null,
  port: null,
  username: null,
  password: null,
  proxyUrl: ''
})
const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  userDataDir: [{ required: true, message: '请输入用户数据目录', trigger: 'blur' }],
  system: [{ required: true, message: '请选择系统', trigger: 'change' }],
  UA: [{ required: true, message: '请选择UA', trigger: 'change' }],
  userAgent: [{ required: true, message: '请输入userAgent', trigger: 'blur' }],
  host: [{ required: true, message: '请输入主机', trigger: 'blur' }],
  port: [{ required: true, message: '请输入端口', trigger: 'blur' }],
  username: [{ required: true, message: '请输入代理账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入代理密码', trigger: 'blur' }]
}

const onChange = () => {
  form.value.userAgent = `Mozilla/5.0 (${form.value.system}; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${form.value.UA} Safari/537.36`
}

const selectDir = async () => {
  const dir = await window.electron.ipcRenderer.invoke('selectDir')
  form.value.userDataDir = dir
}

const bookmarks = ref<{ title: string; url: string; id: string }[]>([])
const addBookmark = () => {
  bookmarks.value.unshift({ title: '', url: '', id: crypto.randomUUID() })
}

const removeBookmark = (row: any) => {
  bookmarks.value = bookmarks.value.filter((item) => item.id !== row.id)
}

const emit = defineEmits(['confirm'])
const onSubmit = async () => {
  if (!ruleFormRef.value) return
  await ruleFormRef.value.validate((valid) => {
    if (valid) {
      emit('confirm', {
        ...form.value,
        bookmarks: bookmarks.value.filter((item) => item.title && item.url)
      })
      dialogVisible.value = false
      ruleFormRef.value!.resetFields()
    }
  })
}

const onClose = () => {
  ruleFormRef.value!.resetFields()
  dialogVisible.value = false
}

const show = (formData) => {
  form.value = formData
  bookmarks.value = formData.bookmarks || []
  dialogVisible.value = true
}

defineExpose({
  show
})
</script>

<style lang="less" scoped></style>
