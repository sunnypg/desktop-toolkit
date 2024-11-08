<template>
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
        type="primary"
        link
        icon="edit"
        @click="showEdit"
      ></el-button>
    </el-descriptions-item>
    <el-descriptions-item label="邮箱：">
      <span>{{ userInfo.email }}</span>
      <el-button
        style="margin-left: 10px"
        type="primary"
        link
        icon="edit"
        @click="showEmailBind(userInfo.email)"
      ></el-button>
    </el-descriptions-item>
    <el-descriptions-item label="手机号：">
      <span>{{ userInfo.phone }}</span>
      <el-button
        style="margin-left: 10px"
        type="primary"
        link
        icon="edit"
        @click="showPhoneBind(userInfo.phone)"
      ></el-button>
    </el-descriptions-item>
  </el-descriptions>
  <div style="margin-left: 25px">
    <el-button type="success" :loading="checkStatus" @click="checkUpdate">检测更新</el-button>
    <el-button type="primary" :loading="logoutLoading" @click="logout">退出</el-button>
    <el-button type="danger" :loading="destroyLoading" @click="destroy">注销</el-button>
  </div>
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
            >接收验证码</el-button
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
            >接收验证码</el-button
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
</template>

<script setup lang="ts">
import router from '@renderer/router'
import avatar from '@renderer/assets/images/avatar.jpg'
import { myLocalStorage } from '@renderer/utils/storage'
import useCheckUpdate from '@renderer/hooks/useCheckUpdate'

interface IUserInfo {
  username: string
  nickname: string
  email: string
  phone: string
}
const userInfo = ref<IUserInfo>(myLocalStorage.getStorage('userInfo'))

const isEdit = ref(false)
const nicknameInput = ref()
const { checkStatus } = useCheckUpdate()
const checkUpdate = () => window.electron.ipcRenderer.send('checking-for-update')
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
  email: '',
  code: ''
})

const checkEmail = (_rule: any, _value: any, callback: any) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (bindEmailForm.value.email !== '' && !emailRegex.test(bindEmailForm.value.email)) {
    return callback(new Error('请输入正确格式的邮箱'))
  }
  callback()
}
const bindEmailFormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { validator: checkEmail, trigger: 'change' },
    { validator: checkEmail, trigger: 'blur' }
  ],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}
const showEmailBind = (email) => {
  bindEmailForm.value.email = email
  bindEmailVisible.value = true
}
const bindEmailClosed = () => {
  bindEmailRef.value.resetFields()
}

const sendEmailCode = async (email) => {
  const emailCodeInfo = await window.electron.ipcRenderer.invoke('email-code', email)
  myLocalStorage.setStorage('emailCodeInfo', emailCodeInfo)
  ElMessage.success('发送成功')
}
const bindEmail = async () => {
  if (!bindEmailRef.value) return
  await bindEmailRef.value.validate((valid) => {
    if (valid) {
      const emailCodeInfo = myLocalStorage.getStorage('emailCodeInfo')
      if (
        bindEmailForm.value.code !== emailCodeInfo?.code ||
        bindEmailForm.value.email !== emailCodeInfo?.email
      ) {
        ElMessage.error('验证码错误')
        return
      }
      if (Date.now() >= emailCodeInfo?.expiry) {
        ElMessage.error('验证码过期')
        myLocalStorage.deleteStorage('emailCodeInfo')
        return
      }
      userInfo.value.email = emailCodeInfo.email
      myLocalStorage.setStorage('userInfo', userInfo.value)
      myLocalStorage.deleteStorage('emailCodeInfo')
      ElMessage.success('绑定成功')
      bindEmailVisible.value = false
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
const sendPhoneCode = async (phone) => {
  const phoneCodeInfo = await window.electron.ipcRenderer.invoke('phone-code', phone)
  myLocalStorage.setStorage('phoneCodeInfo', phoneCodeInfo)
  ElMessage.success(phoneCodeInfo.message)
}
const bindPhone = async () => {
  if (!bindPhoneRef.value) return
  await bindPhoneRef.value.validate((valid) => {
    if (valid) {
      const phoneCodeInfo = myLocalStorage.getStorage('phoneCodeInfo')
      if (
        bindPhoneForm.value.code !== phoneCodeInfo?.code ||
        bindPhoneForm.value.phone !== phoneCodeInfo?.phone
      ) {
        ElMessage.error('验证码错误')
        return
      }
      if (Date.now() >= phoneCodeInfo?.expiry) {
        ElMessage.error('验证码过期')
        myLocalStorage.deleteStorage('phoneCodeInfo')
        return
      }

      userInfo.value.phone = phoneCodeInfo.phone
      myLocalStorage.setStorage('userInfo', userInfo.value)
      myLocalStorage.deleteStorage('phoneCodeInfo')
      ElMessage.success('绑定成功')
      bindPhoneVisible.value = false
    }
  })
}

const logoutLoading = ref(false)
const logout = () => {
  logoutLoading.value = true
  myLocalStorage.deleteStorage('token')
  setTimeout(() => {
    logoutLoading.value = false
    ElMessage.success('退出成功')
    router.push('/login')
  }, 1000)
}

const destroyLoading = ref(false)
const destroy = () => {
  ElMessageBox.confirm('注销账户将永远无法找回，您确定要注销吗?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      destroyLoading.value = true
      myLocalStorage.deleteStorage('userInfo')
      myLocalStorage.deleteStorage('token')
      setTimeout(() => {
        ElMessage.success('注销成功')
        destroyLoading.value = false
        setTimeout(() => {
          router.push('/login')
        }, 500)
      }, 1000)
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '取消注销'
      })
    })
}
</script>

<style scoped lang="less">
:deep(.el-descriptions__label) {
  display: inline-block;
  width: 80px;
  text-align: right;
}
</style>
