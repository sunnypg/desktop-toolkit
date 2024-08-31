<template>
  <div class="remote-view">
    <FloatBall
      :current-screen-id="currentScreenId"
      :all-screen="allScreen"
      @screen-change="onScreenChange"
    />
    <video
      ref="videoRef"
      tabindex="-1"
      width="100%"
      height="100%"
      autoplay
      style="margin-top: 35px"
      @mousedown="onMouseClick"
      @mouseup="onMouseClick"
      @mousemove="onMouseMove"
      @mousewheel="onMouseWheel"
      @keydown="onKeyboard"
      @keyup="onKeyboard"
    ></video>
  </div>
</template>

<script setup lang="ts">
import { io } from 'socket.io-client'
import { throttle } from '@renderer/utils'
import { useRoute } from 'vue-router'
import { ElLoading } from 'element-plus'
import FloatBall from './FloatBall.vue'
import { ScreenItem, Size } from './type'

const route = useRoute()
const remote_id = route.query.remote_id
const videoID = crypto.randomUUID()
const videoRef = ref()
const allScreen = ref<ScreenItem[]>([])
const allScreenStream = ref<RTCTrackEvent['streams']>([])
const currentScreenSize = ref<Size>()
const currentScreenId = ref<string>('')
const peer: RTCPeerConnection = new RTCPeerConnection()
let channel: RTCDataChannel
let Loading: ReturnType<typeof ElLoading.service>
let videoEl: HTMLVideoElement

onMounted(() => {
  videoEl = document.querySelector('video')!
  Loading = ElLoading.service({
    target: '.remote-view',
    lock: true,
    text: '正在启动远程控制...',
    background: 'rgba(0, 0, 0, 0.7)'
  })
})

peer.onicecandidate = ({ candidate }) => {
  if (candidate) {
    socket.emit('candidate', {
      from: videoID,
      to: remote_id,
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
  changeStream(id)
}

const changeStream = async (id: string) => {
  const stream = allScreenStream.value.find((item) => item.id === id)
  videoRef.value.srcObject = stream
  videoRef.value.onloadedmetadata = () => {
    videoRef.value.play()
    Loading.close()
  }
}

const socket = io('http://10.2.0.36:3000')
socket.on('connect', async () => {
  console.log('websocket 连接成功')
  socket.emit('create', videoID)
  socket.emit('finish', {
    from: videoID,
    to: remote_id
  })

  socket.on('offer', async ({ offer }) => {
    peer.ondatachannel = (event) => {
      channel = event.channel
      channel.onmessage = (event) => {
        allScreen.value = JSON.parse(event.data)
        currentScreenSize.value = {
          offsetX: 0,
          width: allScreen.value[0].width,
          height: allScreen.value[0].height
        }
      }
    }

    await peer.setRemoteDescription(offer)
    let answer = await peer.createAnswer()
    await peer.setLocalDescription(answer)
    socket.emit('answer', {
      answer,
      from: videoID,
      to: remote_id
    })
  })

  socket.on('candidate', async ({ candidate }) => {
    await peer.addIceCandidate(candidate)
  })

  socket.on('disconnect', () => {
    console.log('disconnected')
  })
})

const onMouseMove = throttle(
  (e) => {
    if (!videoEl) return
    const { width, height } = videoEl.getBoundingClientRect()
    const W = currentScreenSize.value!.width / width
    const H = currentScreenSize.value!.height / height
    const realX = e.offsetX * W + currentScreenSize.value!.offsetX
    const realY = e.offsetY * H
    channel.send(JSON.stringify({ type: e.type, x: realX, y: realY }))
  },
  100,
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
