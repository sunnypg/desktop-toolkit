<template>
  <div class="remote-view">
    <el-radio-group
      v-if="allScreen.length > 1"
      v-model="currentScreenId"
      class="screen-btn"
      @change="onChange"
    >
      <el-radio-button
        v-for="item in allScreen"
        :key="item.stream_id"
        :label="item.name"
        :value="item.stream_id"
      />
    </el-radio-group>
    <video
      ref="videoRef"
      class="remote-video"
      tabindex="-1"
      width="100%"
      height="100%"
      autoplay
      @mousedown="onMouseClick"
      @mouseup="onMouseClick"
      @mousemove="mousemove"
      @mousewheel="mousewheel"
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

interface Size {
  width: number
  height: number
}
interface ScreenItem extends Size {
  name: string
  stream_id: string
}

const route = useRoute()
const remote_id = route.query.remote_id
const videoID = crypto.randomUUID()
const videoRef = ref()
const allScreen = ref<ScreenItem[]>([])
const allScreenStream = ref<RTCTrackEvent['streams']>([])
const currentScreenSize = ref<Size>()
const currentScreenId = ref<string>()
const peer: RTCPeerConnection = new RTCPeerConnection()
let channel: RTCDataChannel
peer.onicecandidate = ({ candidate }) => {
  if (candidate) {
    socket.emit('candidate', {
      from: videoID,
      to: remote_id,
      candidate: candidate
    })
  }
}

const onChange = (id: any) => {
  const size = { width: 0, height: 0 }
  for (const screen of allScreen.value) {
    size.width += screen.width
    if (screen.stream_id === id) {
      size.height = screen.height
      return
    }
  }
  currentScreenSize.value = size
  changeStream(id)
}

let Loading = ref()
onMounted(() => {
  Loading.value = ElLoading.service({
    target: '.remote-view',
    lock: true,
    text: '正在启动远程控制...',
    background: 'rgba(0, 0, 0, 0.7)'
  })
})

const changeStream = async (id: string) => {
  const stream = allScreenStream.value.find((item) => item.id === id)
  videoRef.value.srcObject = stream
  videoRef.value.onloadedmetadata = () => {
    videoRef.value.play()
    Loading.value.close()
  }
}

peer.ontrack = (ev: RTCTrackEvent) => {
  allScreenStream.value = ev.streams
  currentScreenId.value = ev.streams[0].id
  changeStream(ev.streams[0].id)
}

const socket = io('http://10.2.0.36:3000')
socket.on('connect', async () => {
  console.log('websocket 连接成功')
  socket.emit('create', videoID)
  socket.emit('finish', {
    from: videoID,
    to: remote_id
  })

  // 收到对方offer
  socket.on('offer', async ({ offer }) => {
    peer.ondatachannel = (event) => {
      channel = event.channel
      channel.onmessage = (event) => {
        allScreen.value = JSON.parse(event.data)
        currentScreenSize.value = {
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

  // 收到对方candidate后，都添加到自己的peer对象上
  socket.on('candidate', async ({ candidate }) => {
    await peer.addIceCandidate(candidate)
  })

  socket.on('disconnect', () => {
    console.log('disconnected')
  })
})

const mousemove = throttle(
  (e) => {
    const video = document.querySelector('video') as HTMLVideoElement
    const { width, height } = video.getBoundingClientRect()
    const W = currentScreenSize.value!.width / width
    const H = currentScreenSize.value!.height / height
    const realX = e.offsetX * W
    const realY = e.offsetY * H
    channel.send(JSON.stringify({ type: e.type, x: realX, y: realY }))
  },
  100,
  { immediate: true, tail: true }
)
const onMouseClick = (e) => {
  channel.send(JSON.stringify({ type: e.type, button: e.button }))
}
const mousewheel = (e) => {
  channel.send(JSON.stringify({ type: e.type, deltaY: e.deltaY }))
}
const onKeyboard = (e) => {
  channel.send(JSON.stringify({ type: e.type, code: e.code }))
}
</script>

<style scoped lang="less">
.screen-btn {
  z-index: 1000;
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
}
.remote-video {
  margin-top: 35px;
}
</style>
