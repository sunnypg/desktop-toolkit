<template>
  <div class="remote-view">
    <video
      style="margin-top: 35px"
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

const route = useRoute()
const remote_id = route.query.remote_id
const videoID = crypto.randomUUID()
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
peer.ontrack = (ev: RTCTrackEvent) => {
  const video = document.querySelector('video') as HTMLVideoElement
  video.srcObject = ev.streams[0]
  video.onloadedmetadata = () => {
    video.play()
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

  // 收到对方offer
  socket.on('offer', async ({ offer }) => {
    peer.ondatachannel = (event) => {
      channel = event.channel
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
    channel.send(JSON.stringify({ type: e.type, x: e.offsetX, y: e.offsetY, width, height }))
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
.remote-view {
  z-index: 999;
}
</style>
