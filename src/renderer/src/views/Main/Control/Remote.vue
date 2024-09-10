<template>
  <div v-if="status === Status.VIDEO" class="remote-view">
    <FloatBall
      :current-screen-id="currentScreenId"
      :all-screen="allScreen"
      @screen-change="onScreenChange"
      @auto-resize="onAutoResize"
      @hide-pointer="(val) => (isHidePointer = val)"
    />
    <video
      ref="videoRef"
      tabindex="-1"
      autoplay
      muted
      :style="{ marginTop: isBrowser ? '' : '35px', cursor: isHidePointer ? 'none' : 'default' }"
      @mousedown="onMouseClick"
      @mouseup="onMouseClick"
      @mousemove="onMouseMove"
      @mousewheel="onMouseWheel"
      @keydown="onKeyboard"
      @keyup="onKeyboard"
    ></video>
  </div>
  <div v-if="status === Status.INPUT" class="remote">
    <el-card class="remote-card">
      <div class="remote-title">远程控制</div>
      <el-form ref="remoteFormRef" :model="remoteForm" :rules="remoteFormRules">
        <el-form-item label="远程码" prop="remote_id">
          <el-input v-model="remoteForm.remote_id" placeholder="请输入远程设备码"></el-input>
        </el-form-item>
        <el-form-item label="验证码" prop="remote_code">
          <el-input v-model="remoteForm.remote_code" placeholder="请输入远程设备验证码"></el-input>
        </el-form-item>
        <el-button type="primary" style="margin-left: 85%" @click="connectAction">连接</el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { io } from 'socket.io-client'
import { throttle } from '@renderer/utils'
import { useRoute } from 'vue-router'
import { ElLoading } from 'element-plus'
import FloatBall from './FloatBall.vue'
import { ScreenItem, Size } from './type'
import router from '@renderer/router'
import { ElNotification } from 'element-plus'
import { mySessionStorage } from '@renderer/utils/storage'

enum Status {
  LOADING = 'loading',
  VIDEO = 'video',
  INPUT = 'input'
}

const route = useRoute()
const remoteFormRef = ref()
const remoteForm = ref({
  remote_id: route.query.remote_id as string,
  remote_code: route.query.code as string
})
const remoteFormRules = {
  remote_id: [
    { required: true, message: '请输入远程设备码', trigger: 'blur' },
    { min: 9, max: 9, message: '远程设备码长度为9位', trigger: 'blur' }
  ],
  remote_code: [
    { required: true, message: '请输入远程设备验证码', trigger: 'blur' },
    { min: 6, max: 6, message: '远程设备验证码长度为6位', trigger: 'blur' }
  ]
}

const videoID = computed(() => {
  if (mySessionStorage.getStorage('videoID')) {
    return mySessionStorage.getStorage('videoID')
  } else {
    const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()
    mySessionStorage.setStorage('videoID', id)
    return id
  }
})
const videoRef = ref()
const allScreen = ref<ScreenItem[]>([])
const allScreenStream = ref<RTCTrackEvent['streams']>([])
const currentScreenSize = ref<Size>()
const currentScreenId = ref<string>('')
const status = ref(Status.LOADING)
const isHidePointer = ref(false)
const isBrowser = !window.electron
const peer: RTCPeerConnection = new RTCPeerConnection()
let channel: RTCDataChannel
let Loading: ReturnType<typeof ElLoading.service> | null
let isAutoResizeVideo = true

const resizeVideo = () => {
  if (!currentScreenSize.value || !isAutoResizeVideo) return
  const remoteRatio = currentScreenSize.value.width / currentScreenSize.value.height
  const bodyWidth = document.body.clientWidth
  const bodyHeight = isBrowser ? document.body.clientHeight : document.body.clientHeight - 35
  const bodyRatio = bodyWidth / bodyHeight
  if (bodyRatio >= remoteRatio) {
    videoRef.value.style.height = bodyHeight + 'px'
    videoRef.value.style.width = bodyHeight * remoteRatio + 'px'
  } else {
    videoRef.value.style.width = document.body.clientWidth + 'px'
    videoRef.value.style.height = document.body.clientWidth / remoteRatio + 'px'
  }
}

const onAutoResize = (isAutoResize: boolean) => {
  isAutoResizeVideo = isAutoResize
  if (isAutoResize) {
    resizeVideo()
  } else {
    videoRef.value.style.width = '100%'
    videoRef.value.style.height = '100%'
  }
}

window.addEventListener('contextmenu', (e) => e.preventDefault())
window.addEventListener('resize', resizeVideo)

peer.onicecandidate = ({ candidate }) => {
  if (candidate) {
    socket.emit('candidate', {
      from: videoID.value,
      to: remoteForm.value.remote_id,
      candidate: candidate
    })
  }
}
peer.ontrack = (ev: RTCTrackEvent) => {
  allScreenStream.value = ev.streams
  currentScreenId.value = ev.streams[0].id
  changeStream(ev.streams[0].id)
}

const onScreenChange = (id: any) => {
  const size: Size = { offsetX: 0, width: 0, height: 0 }
  for (const screen of allScreen.value) {
    if (screen.stream_id !== id) size.offsetX += screen.width
    if (screen.stream_id === id) {
      size.width = screen.width
      size.height = screen.height
      return
    }
  }
  currentScreenSize.value = size
  resizeVideo()
  changeStream(id)
}

const changeStream = async (id: string) => {
  const stream = allScreenStream.value.find((item) => item.id === id)
  videoRef.value.srcObject = stream
  videoRef.value.onloadedmetadata = () => {
    videoRef.value.play()
    Loading?.close()
    Loading = null
  }
}

const connectAction = async () => {
  if (!remoteFormRef.value) return
  await remoteFormRef.value.validate(async (valid) => {
    if (valid) {
      await router.push('/')
      router.push({
        path: '/remote',
        query: {
          remote_id: remoteForm.value.remote_id,
          code: remoteForm.value.remote_code
        }
      })
    }
  })
}

const socket = io('http://10.2.0.36:3000')
socket.on('connect', async () => {
  console.log('websocket 连接成功')
  socket.emit('create', videoID.value)
  if (remoteForm.value.remote_id && remoteForm.value.remote_code) {
    Loading = ElLoading.service({
      target: '.remote-view',
      lock: true,
      text: '正在启动远程控制...',
      background: 'rgba(0, 0, 0, 0.7)'
    })

    setTimeout(() => {
      if (Loading) {
        Loading.close()
        Loading = null
        ElMessage.error('连接超时，请检查远程设备码是否错误')
        status.value = Status.INPUT
      }
    }, 3000)
    socket.emit('finish', {
      from: videoID.value,
      to: remoteForm.value.remote_id,
      code: remoteForm.value.remote_code
    })
  } else {
    status.value = Status.INPUT
  }

  socket.on('offer', async ({ offer }) => {
    status.value = Status.VIDEO
    peer.ondatachannel = (event) => {
      channel = event.channel
      channel.onmessage = (event) => {
        allScreen.value = JSON.parse(event.data)
        currentScreenSize.value = {
          offsetX: 0,
          width: allScreen.value[0].width,
          height: allScreen.value[0].height
        }
        resizeVideo()
      }
    }

    await peer.setRemoteDescription(offer)
    let answer = await peer.createAnswer()
    await peer.setLocalDescription(answer)
    socket.emit('answer', {
      answer,
      from: videoID.value,
      to: remoteForm.value.remote_id
    })
  })

  socket.on('candidate', async ({ candidate }) => {
    await peer.addIceCandidate(candidate)
  })

  socket.on('reply', ({ status: replyStatus }) => {
    if (replyStatus === 'code-error') {
      Loading?.close()
      Loading = null
      ElMessage.error('验证码错误')
      status.value = Status.INPUT
    }
  })

  socket.on('leave', async () => {
    await router.push('/')
    await router.push('/remote')
    ElNotification({
      title: '警告',
      type: 'warning',
      dangerouslyUseHTMLString: true,
      message: `<div style="color: teal">对方已断开连接</div>`,
      position: 'bottom-right',
      duration: 0
    })
  })

  socket.on('disconnect', () => {
    console.log('disconnected')
  })
})

const onMouseMove = throttle(
  (e) => {
    if (!videoRef.value) return
    const { width, height } = videoRef.value.getBoundingClientRect()
    const W = currentScreenSize.value!.width / width
    const H = currentScreenSize.value!.height / height
    const realX = e.offsetX * W + currentScreenSize.value!.offsetX
    const realY = e.offsetY * H
    channel.send(JSON.stringify({ type: e.type, x: realX, y: realY }))
  },
  30,
  { immediate: true, tail: true }
)
const onMouseClick = (e) => {
  channel.send(JSON.stringify({ type: e.type, button: e.button }))
}
const onMouseWheel = (e) => {
  channel.send(JSON.stringify({ type: e.type, deltaY: e.deltaY }))
}
const onKeyboard = (e) => {
  channel.send(JSON.stringify({ type: e.type, code: e.code }))
}
</script>

<style scoped lang="less">
.remote-view {
  display: flex;
  justify-content: center;
  align-items: center;
}

.remote {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #e1e6ed;

  .remote-card {
    width: 500px;
    transform: translate(0, -50%);
  }

  .remote-title {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 20px;
  }
}
</style>
