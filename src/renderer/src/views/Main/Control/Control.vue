<template>
  <el-card>
    <template #header>
      <div style="font-weight: 700; font-size: 20px">远程控制</div>
    </template>
    <el-form v-if="!IsController" :data="remoteForm">
      <el-form-item>
        <el-radio-group v-model="remoteForm.type">
          <el-radio-button label="观看模式" :value="1" />
          <el-radio-button label="控制模式" :value="2" />
        </el-radio-group>
      </el-form-item>
      <el-form-item>
        <el-input :value="remoteForm.localUUID" disabled style="max-width: 600px">
          <template #prepend> 我的设备 </template>
        </el-input>
        <el-button type="info" @click="copy(remoteForm.localUUID)">复制</el-button>
      </el-form-item>
      <el-form-item>
        <el-input v-model="remoteForm.remoteUUID" style="max-width: 600px">
          <template #prepend> 远程设备 </template>
        </el-input>
        <el-button type="primary" @click="requestRemote">请求远程</el-button>
        <el-button type="primary" @click="openWindow">打开窗口</el-button>
      </el-form-item>
    </el-form>
    <el-dialog v-model="dialogVisible" title="通知">
      <span>{{ message }}</span>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel">不同意</el-button>
          <el-button type="primary" @click="confirm">同意</el-button>
        </div>
      </template>
    </el-dialog>
    <video
      v-if="IsController"
      tabindex="-1"
      width="100%"
      height="100%"
      autoplay
      @mousedown="mousedown"
      @mouseup="mouseup"
      @mousemove="mousemove"
      @mousewheel="mousewheel"
    ></video>
  </el-card>
</template>

<script setup lang="ts">
import { io } from 'socket.io-client'
import useClipboard from 'vue-clipboard3'
import { createVideoRTC } from './RTC'
import { throttle } from '@renderer/utils'

const remoteForm = ref({
  type: 1,
  localUUID: crypto.randomUUID(),
  remoteUUID: ''
})

const dialogVisible = ref(false)
const message = ref('')
const IsController = ref(false)

const { toClipboard } = useClipboard()
const copy = async (text: string) => {
  try {
    await toClipboard(text)
    ElMessage.success('复制成功')
  } catch (e) {
    ElMessage.error('复制失败')
  }
}

const openWindow = async () => {
  await window.electron.ipcRenderer.invoke('open-remote')
}

let dataChannel: RTCDataChannel
const mousemove = throttle(
  (e) => {
    const video = document.querySelector('video') as HTMLVideoElement
    const { width, height } = video.getBoundingClientRect()
    dataChannel.send(JSON.stringify({ type: e.type, x: e.offsetX, y: e.offsetY, width, height }))
  },
  30,
  { immediate: true, tail: true }
)
const mousedown = (e) => {
  dataChannel.send(JSON.stringify({ type: e.type, button: e.button }))
}
const mouseup = (e) => {
  dataChannel.send(JSON.stringify({ type: e.type, button: e.button }))
}
const mousewheel = (e) => {
  dataChannel.send(JSON.stringify({ type: e.type, deltaY: e.deltaY }))
}

const socket = io('http://192.168.50.173:3000')
socket.on('connect', async () => {
  console.log('websocket 连接成功')
  let peer = await createVideoRTC(socket, remoteForm)
  socket.emit('create', remoteForm.value.localUUID)

  // 收到对方请求
  socket.on('request', (res) => {
    dialogVisible.value = true
    message.value = res.message
    remoteForm.value.remoteUUID = res.from
  })

  socket.on('reply', async (res) => {
    if (res.agree) {
      // 收到对方同意的回复
      IsController.value = true
      ElMessage.success(res.message)

      nextTick(() => {
        const video = document.querySelector('video') as HTMLElement
        video.addEventListener('keydown', function (e) {
          dataChannel.send(JSON.stringify({ type: e.type, code: e.code }))
        })
        video.addEventListener('keyup', function (e) {
          dataChannel.send(JSON.stringify({ type: e.type, code: e.code }))
        })
      })

      dataChannel = peer.createDataChannel('keyboard', {
        ordered: false
      })
      dataChannel.onopen = () => {
        console.log('dataChannel打开')
      }
      peer.ontrack = (ev: RTCTrackEvent) => {
        const video = document.querySelector('video') as HTMLVideoElement
        video.srcObject = ev.streams[0]
        video.onloadedmetadata = () => {
          video.play()
        }
      }

      let offer = await peer.createOffer()
      await peer.setLocalDescription(offer)
      socket.emit('offer', {
        offer,
        from: remoteForm.value.localUUID,
        to: remoteForm.value.remoteUUID
      })
    } else {
      ElMessage.error(res.message)
    }
  })

  // 收到对方offer
  socket.on('offer', async (res) => {
    peer.ondatachannel = (event) => {
      dataChannel = event.channel
      dataChannel.onopen = () => {
        console.log('dataChannel打开')
      }
      dataChannel.onmessage = (event) => {
        const data = JSON.parse(event.data)
        switch (data.type) {
          case 'mousedown':
            ElMessage.success(`按下【${data.button}】`)
            window.electron.ipcRenderer.send('mouse-event', data)
            break
          case 'mouseup':
            ElMessage.success(`抬起【${data.button}】`)
            window.electron.ipcRenderer.send('mouse-event', data)
            break
          case 'mousemove':
            ElMessage.success(`移动到位置：X:${data.x}，Y:${data.y}`)
            window.electron.ipcRenderer.send('mouse-move', data)
            break
          case 'mousewheel':
            ElMessage.success(`滚动了：X:${data.deltaY}`)
            window.electron.ipcRenderer.send('mouse-event', data)
            break
          case 'keydown':
            ElMessage.success(`按下了【${data.code}】键`)
            window.electron.ipcRenderer.send('keyboard-event', data)
            break
          case 'keyup':
            ElMessage.success(`抬起了【${data.code}】键`)
            window.electron.ipcRenderer.send('keyboard-event', data)
            break
          default:
            break
        }
      }
    }

    await peer.setRemoteDescription(res.offer)
    let answer = await peer.createAnswer()
    await peer.setLocalDescription(answer)
    socket.emit('answer', {
      answer,
      from: remoteForm.value.localUUID,
      to: remoteForm.value.remoteUUID
    })
  })

  // 收到对方answer
  socket.on('answer', async (res) => {
    await peer.setRemoteDescription(res.answer)
  })

  // 收到对方candidate
  socket.on('candidate', async (res) => {
    console.log(`收到candidate信息，发送方：${res.from}，接收方：${res.to}`)
    await peer.addIceCandidate(res.candidate) // 收到对方candidate后，都添加到自己的peer对象上
  })
})

socket.on('disconnect', () => {
  console.log('disconnected')
})

const requestRemote = async () => {
  socket.emit('request', {
    from: remoteForm.value.localUUID,
    to: remoteForm.value.remoteUUID
  })
}

const cancel = () => {
  dialogVisible.value = false
  socket.emit('reply', {
    from: remoteForm.value.localUUID,
    to: remoteForm.value.remoteUUID,
    agree: false
  })
}

const confirm = () => {
  dialogVisible.value = false
  socket.emit('reply', {
    from: remoteForm.value.localUUID,
    to: remoteForm.value.remoteUUID,
    agree: true
  })
}

onUnmounted(() => {
  socket.disconnect()
})
</script>
