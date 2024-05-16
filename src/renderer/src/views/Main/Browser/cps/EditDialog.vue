<template>
  <el-dialog v-model="dialogVisible" :title="`${form.name} 环境`" width="60%">
    <el-form ref="ruleFormRef" :model="form" :rules="rules" label-width="auto">
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
        <el-input v-model="form.userAgent" placeholder="请输入User Agent" style="max-width: 600px">
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
    </el-form>
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
import { UAOptions, WindowsOptions } from '../options'

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
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.112 Safari/537.36'
})
const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  userDataDir: [{ required: true, message: '请输入用户数据目录', trigger: 'blur' }],
  system: [{ required: true, message: '请选择系统', trigger: 'change' }],
  UA: [{ required: true, message: '请选择UA', trigger: 'change' }],
  userAgent: [{ required: true, message: '请输入userAgent', trigger: 'blur' }]
}

const onChange = () => {
  form.value.userAgent = `Mozilla/5.0 (${form.value.system}; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${form.value.UA} Safari/537.36`
}

const selectDir = async () => {
  const dir = await window.electron.ipcRenderer.invoke('selectDir')
  form.value.userDataDir = dir
}

const emit = defineEmits(['confirm'])
const onSubmit = async () => {
  if (!ruleFormRef.value) return
  await ruleFormRef.value.validate((valid) => {
    if (valid) {
      emit('confirm', { ...form.value })
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
  dialogVisible.value = true
}

defineExpose({
  show
})
</script>

<style lang="less" scoped></style>
