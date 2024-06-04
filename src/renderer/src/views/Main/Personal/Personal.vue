<template>
  <div class="personal">
    <el-card style="height: calc(100vh - 80px)">
      <el-tabs tab-position="left" style="height: calc(100vh - 120px)">
        <el-tab-pane label="个人信息">
          <el-descriptions :column="1">
            <el-descriptions-item label="头像："
              ><el-avatar class="avatar" :size="30" :src="avatar"
            /></el-descriptions-item>
            <el-descriptions-item label="用户名：">{{ userInfo.username }}</el-descriptions-item>
            <el-descriptions-item label="昵称：">
              <span v-show="!isEdit">{{ userInfo.nickname }}</span>
              <el-input
                v-show="isEdit"
                ref="nicknameInput"
                v-model="userInfo.nickname"
                style="max-width: 30%"
                @keyup.enter="editNickname"
                @blur="editNickname"
              ></el-input>
              <el-button
                style="margin-left: 10px"
                type="text"
                icon="edit"
                @click="showEdit"
              ></el-button>
            </el-descriptions-item>
            <el-descriptions-item label="邮箱：">
              <span>{{ userInfo.email }}</span>
              <el-button
                style="margin-left: 10px"
                type="text"
                icon="edit"
                @click="showEmailBind(userInfo.email)"
              ></el-button>
            </el-descriptions-item>
            <el-descriptions-item label="手机号：">
              <span>{{ userInfo.phone }}</span>
              <el-button
                style="margin-left: 10px"
                type="text"
                icon="edit"
                @click="showPhoneBind(userInfo.phone)"
              ></el-button>
            </el-descriptions-item>
          </el-descriptions>
          <div class="btn">
            <el-button type="primary" @click="logout">退出</el-button>
            <el-button type="danger">注销</el-button>
          </div>
        </el-tab-pane>
        <el-tab-pane label="设置">
          <el-descriptions title="爬虫配置" :column="1">
            <el-descriptions-item label="存储路径：">
              <el-input
                v-model="crawlerConfig.savePath"
                placeholder="请选择存储路径"
                disabled
                style="width: 30%"
              >
                <template #append>
                  <el-button @click="selectDir(crawlerConfig, 'savePath')">选择</el-button>
                </template>
              </el-input>
            </el-descriptions-item>
            <el-descriptions-item label="无头模式：">
              <el-switch v-model="crawlerConfig.headless"></el-switch>
            </el-descriptions-item>
          </el-descriptions>
          <el-descriptions title="录屏配置" :column="1">
            <el-descriptions-item v-for="item in data" :key="item.label" :label="`${item.label}：`">
              <el-select
                v-model="recordingConfig[item.prop]"
                :placeholder="item.placeholder"
                style="width: 30%"
              >
                <el-option
                  v-for="option in item.options"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-descriptions-item>
            <el-descriptions-item label="存放目录：">
              <el-input
                v-model="recordingConfig.saveDir"
                placeholder="请选择存放目录"
                disabled
                style="width: 30%"
              >
                <template #append>
                  <el-button @click="selectDir(recordingConfig, 'saveDir')">选择</el-button>
                </template>
              </el-input>
            </el-descriptions-item>
          </el-descriptions>
          <div class="btn">
            <el-button type="primary" @click="saveConfig">保存</el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    <el-dialog v-model="bindEmailVisible" title="绑定邮箱" width="35%" @close="bindEmailClosed">
      <el-form
        ref="bindEmailRef"
        :model="bindEmailForm"
        :rules="bindEmailFormRules"
        label-width="65px"
      >
        <el-form-item label="邮箱" prop="email">
          <div style="display: flex">
            <el-input v-model="bindEmailForm.email" placeholder="请输入邮箱" style="width: 215px">
            </el-input>
            <el-button text bg type="primary" @click="sendEmailCode(bindEmailForm.email)"
              >发送验证码</el-button
            >
          </div>
        </el-form-item>
        <el-form-item label="验证码" prop="code">
          <el-input v-model="bindEmailForm.code" placeholder="请输入验证码"> </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <div>
          <el-button @click="bindEmailVisible = false">关闭</el-button>
          <el-button type="primary" @click="bindEmail">绑定</el-button>
        </div>
      </template>
    </el-dialog>
    <el-dialog v-model="bindPhoneVisible" title="绑定手机" width="35%" @close="bindPhoneClosed">
      <el-form
        ref="bindPhoneRef"
        :model="bindPhoneForm"
        :rules="bindPhoneFormRules"
        label-width="65px"
      >
        <el-form-item label="手机" prop="phone">
          <div style="display: flex">
            <el-input v-model="bindPhoneForm.phone" placeholder="请输入手机号" style="width: 215px">
            </el-input>
            <el-button text bg type="primary" @click="sendPhoneCode(bindPhoneForm.phone)"
              >发送验证码</el-button
            >
          </div>
        </el-form-item>
        <el-form-item label="验证码" prop="code">
          <el-input v-model="bindPhoneForm.code" placeholder="请输入验证码"> </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <div>
          <el-button @click="bindPhoneVisible = false">关闭</el-button>
          <el-button type="primary" @click="bindPhone">绑定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import avatar from '@renderer/assets/images/avatar.jpg'
import router from '@renderer/router'
import { myLocalStorage } from '@renderer/utils/storage'

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

interface IUserInfo {
  username: string
  nickname: string
  email: string
  phone: string
}
const userInfo = ref<IUserInfo>(myLocalStorage.getStorage('userInfo'))

interface IRecordingConfig {
  definition: number
  fps: string
  type: string
  saveDir: string
}
const recordingConfig = ref<IRecordingConfig>(myLocalStorage.getStorage('recordingConfig') || {})

interface ICrawlerConfig {
  savePath: string
  headless: boolean
}
const crawlerConfig = ref<ICrawlerConfig>(myLocalStorage.getStorage('crawlerConfig') || {})

const selectDir = async (target, key) => {
  const dir = await window.electron.ipcRenderer.invoke('selectDir')
  target[key] = dir
}

const saveConfig = () => {
  myLocalStorage.setStorage('crawlerConfig', crawlerConfig.value)
  myLocalStorage.setStorage('recordingConfig', recordingConfig.value)
  ElMessage.success('保存成功')
}

const isEdit = ref(false)
const nicknameInput = ref()
const showEdit = () => {
  isEdit.value = true
  nicknameInput.value.focus()
}
const editNickname = () => {
  if (userInfo.value.nickname) {
    myLocalStorage.setStorage('userInfo', userInfo.value)
  } else {
    userInfo.value.nickname = myLocalStorage.getStorage('userInfo').nickname
  }
  isEdit.value = false
}

// 绑定邮箱
const bindEmailRef = ref()
const bindEmailVisible = ref(false)
const bindEmailForm = ref({
  email: null,
  code: null
})
const bindEmailFormRules = {
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}
const showEmailBind = (email) => {
  bindEmailForm.value.email = email
  bindEmailVisible.value = true
}
const bindEmailClosed = () => {
  bindEmailRef.value.resetFields()
}
const sendEmailCode = (email) => {
  console.log(email)
}
const bindEmail = async () => {
  if (!bindEmailRef.value) return
  await bindEmailRef.value.validate((valid, fields) => {
    if (valid) {
      userInfo.value.email = bindEmailForm.value.email!
      myLocalStorage.setStorage('userInfo', userInfo.value)
      ElMessage.success('绑定邮箱成功')
      bindEmailVisible.value = false
    } else {
      console.log('error submit!', fields)
    }
  })
}

// 绑定手机
const bindPhoneRef = ref()
const bindPhoneVisible = ref(false)
const bindPhoneForm = ref({
  phone: null,
  code: null
})
const bindPhoneFormRules = {
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}
const showPhoneBind = (phone) => {
  bindPhoneForm.value.phone = phone
  bindPhoneVisible.value = true
}
const bindPhoneClosed = () => {
  bindPhoneRef.value.resetFields()
}
const sendPhoneCode = (phone) => {
  console.log(phone)
}
const bindPhone = async () => {
  if (!bindPhoneRef.value) return
  await bindPhoneRef.value.validate((valid, fields) => {
    if (valid) {
      userInfo.value.phone = bindPhoneForm.value.phone!
      myLocalStorage.setStorage('userInfo', userInfo.value)
      ElMessage.success('绑定手机成功')
      bindPhoneVisible.value = false
    } else {
      console.log('error submit!', fields)
    }
  })
}

const logout = () => {
  myLocalStorage.deleteStorage('token')
  router.push('/login')
}
</script>

<style lang="less" scoped>
.btn {
  margin-left: 25px;
}

:deep(.el-descriptions__label) {
  display: inline-block;
  width: 80px;
  text-align: right;
}
</style>
