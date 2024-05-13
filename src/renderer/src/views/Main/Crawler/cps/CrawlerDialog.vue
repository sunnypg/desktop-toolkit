<template>
  <el-dialog v-model="dialogVisible" title="配置" width="60%">
    <el-form ref="ruleFormRef" :model="form" :rules="rules" label-width="auto">
      <el-form-item label="网址" prop="address">
        <el-input
          v-model="form.address"
          type="textarea"
          :autosize="{ minRows: 6, maxRows: 10 }"
          placeholder="请输入网址（换行填写多个网址）"
        />
      </el-form-item>
      <el-form-item label="存储路径" prop="savePath">
        <el-input v-model="form.savePath" placeholder="请选择存储路径" disabled>
          <template #append>
            <el-button @click="selectDir">选择</el-button>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="无头模式" prop="headless">
        <el-switch v-model="form.headless" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div>
        <el-button type="primary" @click="onSubmit">确定</el-button>
        <el-button type="warning" @click="onClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import { ref } from 'vue'

const dialogVisible = ref(false)

const show = () => {
  dialogVisible.value = true
}

const ruleFormRef = ref<FormInstance>()
const form = ref<any>({
  address: null,
  savePath: null,
  headless: false
})
const rules = {
  address: [{ required: true, message: '请输入网址', trigger: 'blur' }],
  savePath: [{ required: true, message: '请输入存储路径', trigger: 'blur' }]
}

const emit = defineEmits(['confirm'])
const onSubmit = async () => {
  if (!ruleFormRef.value) return
  await ruleFormRef.value.validate((valid) => {
    if (valid) {
      const newForm = {
        ...form.value,
        address: form.value.address.split('\n').map((item) => item.trim())
      }
      emit('confirm', newForm)
      dialogVisible.value = false
      ruleFormRef.value!.resetFields()
    }
  })
}

const onClose = () => {
  ruleFormRef.value!.resetFields()
  dialogVisible.value = false
}

const selectDir = async () => {
  const dir = await window.electron.ipcRenderer.invoke('selectDir')
  form.value.savePath = dir
}

defineExpose({
  show
})
</script>

<style lang="less" scoped></style>
