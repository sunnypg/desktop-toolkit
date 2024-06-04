<template>
  <el-dialog v-model="dialogVisible" title="录屏配置" width="30%">
    <div class="dialog-from">
      <el-form
        ref="ruleFormRef"
        :model="form"
        :rules="rules"
        label-width="auto"
        style="padding-right: 10px"
      >
        <el-form-item v-for="item in data" :key="item.label" :label="item.label" :prop="item.prop">
          <el-select v-model="form[item.prop]" :placeholder="item.placeholder">
            <el-option
              v-for="option in item.options"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="存放目录" prop="saveDir">
          <el-input v-model="form.saveDir" placeholder="请选择存放目录" disabled>
            <template #append>
              <el-button @click="selectDir">选择</el-button>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div>
        <el-button type="primary" @click="onSubmit">确定</el-button>
        <el-button type="warning" @click="onClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { myLocalStorage } from '@renderer/utils/storage'
import type { FormInstance } from 'element-plus'
import { ref } from 'vue'

const data = ref([
  {
    label: '分辨率',
    prop: 'definition',
    placeholder: '请选择分辨率',
    options: [
      { label: '100%', value: 1 },
      { label: '75%', value: 0.75 },
      { label: '50%', value: 0.5 },
      { label: '25%', value: 0.25 }
    ]
  },
  {
    label: '帧率',
    prop: 'fps',
    placeholder: '请选择帧率',
    options: [
      { label: '高', value: '60' },
      { label: '中', value: '30' },
      { label: '低', value: '15' }
    ]
  },
  {
    label: '另存为',
    prop: 'type',
    placeholder: '请选择保存类型',
    options: [
      { label: 'webm', value: 'webm' },
      { label: 'mp4', value: 'mp4' },
      { label: 'gif', value: 'gif' }
    ]
  }
])
window.electron.ipcRenderer.invoke('screen_size').then((res) => {
  data.value[0].options = data.value[0].options.map((option) => {
    return {
      label: `${option.label}（${res.width * option.value}x${res.height * option.value}）`,
      value: option.value
    }
  })
})

const dialogVisible = ref(false)
const show = () => {
  dialogVisible.value = true
}

const ruleFormRef = ref<FormInstance>()
interface IFrom {
  definition: number
  fps: string
  type: string
  saveDir: string
}
const form = ref<IFrom>(myLocalStorage.getStorage('recordingConfig') || {})
console.log(form.value)

const rules = {
  definition: [{ required: true, message: '请选择分辨率', trigger: 'change' }],
  fps: [{ required: true, message: '请选择帧率', trigger: 'change' }],
  type: [{ required: true, message: '请选择保存类型', trigger: 'change' }],
  saveDir: [{ required: true, message: '请选择存放目录', trigger: 'change' }]
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

const selectDir = async () => {
  const dir = await window.electron.ipcRenderer.invoke('selectDir')
  form.value.saveDir = dir
}

const onClose = () => {
  ruleFormRef.value!.resetFields()
  dialogVisible.value = false
}

defineExpose({
  show
})
</script>

<style lang="less" scoped></style>
