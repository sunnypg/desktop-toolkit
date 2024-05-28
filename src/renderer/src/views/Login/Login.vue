<template>
  <div :class="['login', isRegister ? 'sign-up-mode' : '']">
    <div class="container">
      <div class="form-container">
        <!-- 登录 -->
        <div class="login-form">
          <h2 class="title">Sign in</h2>
          <el-form
            ref="loginFormRef"
            :model="loginForm"
            :rules="loginFormRules"
            :show-message="false"
          >
            <el-form-item prop="username">
              <el-input v-model="loginForm.username" placeholder="Username or Email">
                <template #prefix>
                  <el-icon size="30" class="input-icon"><Avatar /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                placeholder="Password"
                type="password"
                show-password
              >
                <template #prefix>
                  <el-icon size="30" class="input-icon"><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>
          </el-form>
          <el-button type="primary" class="btn" @click="login">登录</el-button>
          <p class="social-text">或者使用其他方式</p>
          <div class="social-media">
            <span class="social-icon">
              <SvgIcon icon-name="icon-tengxunqie"></SvgIcon>
            </span>
            <span class="social-icon">
              <SvgIcon icon-name="icon-weixin"></SvgIcon>
            </span>
            <span class="social-icon">
              <SvgIcon icon-name="icon-weibo"></SvgIcon>
            </span>
            <span class="social-icon">
              <SvgIcon icon-name="icon-zhifubao"></SvgIcon>
            </span>
          </div>
        </div>
        <!-- 注册 -->
        <div class="register-form">
          <h2 class="title">Sign up</h2>
          <el-form
            ref="registerFormRef"
            :model="registerForm"
            :rules="registerFormRules"
            :show-message="false"
          >
            <el-form-item prop="username">
              <el-input v-model="registerForm.username" placeholder="Username">
                <template #prefix>
                  <el-icon size="30" class="input-icon"><Avatar /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item prop="email">
              <el-input v-model="registerForm.email" placeholder="Email">
                <template #prefix>
                  <el-icon size="30" class="input-icon"><Message /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="registerForm.password"
                placeholder="Password"
                type="password"
                show-password
              >
                <template #prefix>
                  <el-icon size="30" class="input-icon"><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>
          </el-form>
          <el-button type="primary" class="btn" @click="register">注册</el-button>
          <p class="social-text">或者使用其他方式</p>
          <div class="social-media">
            <span class="social-icon">
              <SvgIcon icon-name="icon-tengxunqie"></SvgIcon>
            </span>
            <span class="social-icon">
              <SvgIcon icon-name="icon-weixin"></SvgIcon>
            </span>
            <span class="social-icon">
              <SvgIcon icon-name="icon-weibo"></SvgIcon>
            </span>
            <span class="social-icon">
              <SvgIcon icon-name="icon-zhifubao"></SvgIcon>
            </span>
          </div>
        </div>
      </div>
    </div>
    <div class="panels-container">
      <div class="panel left-panel">
        <div class="content">
          <h3>没有帐号 ?</h3>
          <p>输入您的详细信息并与我们一起开始您的旅程</p>
          <el-button type="primary" class="panel-btn" @click="isRegister = true">去注册</el-button>
        </div>
        <img src="@renderer/assets/images/log.svg" class="image" alt="" />
      </div>
      <div class="panel right-panel">
        <div class="content">
          <h3>加入我们 ?</h3>
          <p>为了与我们保持联系，请使用您的个人信息登录</p>
          <el-button type="primary" class="panel-btn" @click="isRegister = false">去登录</el-button>
        </div>
        <img src="@renderer/assets/images/register.svg" class="image" alt="" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import router from '@renderer/router'
import { myLocalStorage } from '@renderer/utils/storage'
import { FormInstance } from 'element-plus'
const isRegister = ref(false)

const loginFormRef = ref<FormInstance>()
const loginForm = ref({
  username: '',
  password: ''
})

const loginFormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const login = async () => {
  if (!loginFormRef.value) return
  await loginFormRef.value.validate((valid, fields) => {
    if (valid) {
      const userInfo = myLocalStorage.getStorage('userInfo') || {}
      if (
        (loginForm.value.username !== userInfo.username &&
          loginForm.value.username !== userInfo.email) ||
        loginForm.value.password !== userInfo.password
      ) {
        ElMessage.error('用户名或密码错误')
        return
      } else {
        myLocalStorage.setStorage('token', 'Bearer Token')
        ElMessage.success('登录成功')
        router.push('/')
      }
    } else {
      console.log('error submit!', fields)
    }
  })
}

const registerFormRef = ref<FormInstance>()
const registerForm = ref({
  username: '',
  email: '',
  password: ''
})

const checkEmail = (_rule: any, _value: any, callback: any) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (registerForm.value.email !== '' && !emailRegex.test(registerForm.value.email)) {
    callback(new Error('请输入正确格式的邮箱'))
  }
}

const checkPassword = (_rule: any, _value: any, callback: any) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  if (registerForm.value.email !== '' && !regex.test(registerForm.value.password)) {
    callback(new Error('密码必须包含a-z/A-Z/0-9/@$!%*?&且最少8位'))
  }
}

const registerFormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { validator: checkEmail, trigger: 'change' },
    { validator: checkEmail, trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { validator: checkPassword, trigger: 'change' },
    { validator: checkPassword, trigger: 'blur' }
  ]
}

const register = async () => {
  if (!registerFormRef.value) return
  await registerFormRef.value.validate((valid, fields) => {
    if (valid) {
      myLocalStorage.setStorage('userInfo', registerForm.value)
      ElMessage.success('注册成功')
    } else {
      console.log('error submit!', fields)
    }
  })
}
</script>

<style lang="less" scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.login {
  position: relative;
  width: 100%;
  background-color: #fff;
  min-height: 100vh;
  overflow: hidden;
}

.container {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.form-container {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  left: 75%;
  width: 50%;
  transition: 1s 0.7s ease-in-out;
  display: grid;
  grid-template-columns: 1fr;
  z-index: 5;
}

.login-form,
.register-form {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 0rem 5rem;
  transition: all 0.2s 0.7s;
  overflow: hidden;
  grid-column: 1 / 2;
  grid-row: 1 / 2;
}

.register-form {
  opacity: 0;
  z-index: 1;
}

.login-form {
  z-index: 2;
}

.title {
  font-size: 2.2rem;
  color: #444;
  margin-bottom: 10px;
}

.el-form {
  max-width: 380px;
  min-width: 240px;
  width: 30vw;
}

:deep(.el-input__wrapper) {
  height: 50px;
  background-color: #f0f0f0;
  box-shadow: none;
  border-radius: 50px;
  margin-top: 10px;
  margin-bottom: 10px;
}

:deep(.el-form-item.is-error .el-input__wrapper) {
  box-shadow: none;
}

.input-icon {
  margin: 0 12px;
}

.social-text {
  padding: 0.7rem 0;
  font-size: 15px;
  color: #444;
  font-family: Verdana, Geneva, Tahoma, sans-serif;
}

.social-media {
  display: flex;
  justify-content: center;
}

.social-icon {
  height: 50px;
  width: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 0.45rem;
  font-size: 2.2rem;
  transition: 0.3s;
  cursor: pointer;
}

.btn {
  width: 150px;
  height: 45px;
  border-radius: 45px;
  font-size: 18px;
  font-weight: 600;
  margin: 10px;
}

.panels-container {
  position: absolute;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
}

.login:before {
  content: '';
  position: absolute;
  height: 2000px;
  width: 2000px;
  top: -10%;
  right: 48%;
  transform: translateY(-50%);
  background-image: linear-gradient(-45deg, #4481eb 0%, #04befe 100%);
  transition: 1.8s ease-in-out;
  border-radius: 50%;
  z-index: 6;
}

.image {
  width: 100%;
  transition: transform 1.1s ease-in-out;
  transition-delay: 0.4s;
}

.panel {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-around;
  text-align: center;
  z-index: 6;
}

.left-panel {
  pointer-events: all;
  padding: 3rem 17% 2rem 12%;
}

.right-panel {
  pointer-events: none;
  padding: 3rem 12% 2rem 17%;
}

.panel .content {
  color: #fff;
  transition: transform 0.9s ease-in-out;
  transition-delay: 0.6s;
}

.panel h3 {
  font-weight: 600;
  line-height: 1;
  font-size: 1.5rem;
}

.panel p {
  font-size: 0.95rem;
  padding: 0.7rem 0;
}

.panel-btn {
  width: 135px;
  height: 41px;
  border-radius: 45px;
  font-size: 14px;
  font-weight: 600;
  background: none;
  border: 2px solid #fff;
}

.right-panel .image,
.right-panel .content {
  transform: translateX(800px);
}

/* ANIMATION */

.login.sign-up-mode:before {
  transform: translate(100%, -50%);
  right: 52%;
}

.login.sign-up-mode .left-panel .image,
.login.sign-up-mode .left-panel .content {
  transform: translateX(-800px);
}

.login.sign-up-mode .form-container {
  left: 25%;
}

.login.sign-up-mode .register-form {
  opacity: 1;
  z-index: 2;
}

.login.sign-up-mode .login-form {
  opacity: 0;
  z-index: 1;
}

.login.sign-up-mode .right-panel .image,
.login.sign-up-mode .right-panel .content {
  transform: translateX(0%);
}

.login.sign-up-mode .left-panel {
  pointer-events: none;
}

.login.sign-up-mode .right-panel {
  pointer-events: all;
}

@media (max-width: 870px) {
  .login {
    min-height: 800px;
    height: 100vh;
  }
  .form-container {
    width: 100%;
    top: 95%;
    transform: translate(-50%, -100%);
    transition: 1s 0.8s ease-in-out;
  }

  .form-container,
  .login.sign-up-mode .form-container {
    left: 50%;
  }

  .panels-container {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 2fr 1fr;
  }

  .panel {
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    padding: 2.5rem 8%;
    grid-column: 1 / 2;
  }

  .right-panel {
    grid-row: 3 / 4;
  }

  .left-panel {
    grid-row: 1 / 2;
  }

  .image {
    width: 200px;
    transition: transform 0.9s ease-in-out;
    transition-delay: 0.6s;
  }

  .panel .content {
    padding-right: 15%;
    transition: transform 0.9s ease-in-out;
    transition-delay: 0.8s;
  }

  .panel h3 {
    font-size: 1.2rem;
  }

  .panel p {
    font-size: 0.7rem;
    padding: 0.5rem 0;
  }

  .panel-btn {
    width: 110px;
    height: 35px;
    font-size: 0.7rem;
  }

  .login:before {
    width: 1500px;
    height: 1500px;
    transform: translateX(-50%);
    left: 30%;
    bottom: 68%;
    right: initial;
    top: initial;
    transition: 2s ease-in-out;
  }

  .login.sign-up-mode:before {
    transform: translate(-50%, 100%);
    bottom: 32%;
    right: initial;
  }

  .login.sign-up-mode .left-panel .image,
  .login.sign-up-mode .left-panel .content {
    transform: translateY(-300px);
  }

  .login.sign-up-mode .right-panel .image,
  .login.sign-up-mode .right-panel .content {
    transform: translateY(0px);
  }

  .right-panel .image,
  .right-panel .content {
    transform: translateY(300px);
  }

  .login.sign-up-mode .form-container {
    top: 5%;
    transform: translate(-50%, 0);
  }
}

@media (max-width: 570px) {
  .login-form,
  .register-form {
    padding: 0 1.5rem;
  }

  .image {
    display: none;
  }
  .panel .content {
    padding: 0.5rem 1rem;
  }
  .login {
    padding: 1.5rem;
  }

  .login:before {
    bottom: 72%;
    left: 50%;
  }

  .login.sign-up-mode:before {
    bottom: 28%;
    left: 50%;
  }
}
</style>
