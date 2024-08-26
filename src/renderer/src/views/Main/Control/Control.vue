<template>
  <el-card>
    <template v-if="deviceStatus !== DeviceStatus.CONTROLLER">
      <div class="title">允许控制本设备</div>
      <div class="local">
        <div class="local-code">
          <div class="code-name">本机设备识别码</div>
          <div>
            <span class="code">{{ remoteForm.localID }}</span>
            <el-icon class="copy-btn" @click="copy(remoteForm.localID)"><CopyDocument /></el-icon>
          </div>
        </div>
        <div class="local-code">
          <div class="code-name">长期验证码</div>
          <div>
            <span class="code">{{ remoteForm.code }}</span>
            <el-icon class="copy-btn" @click="copy(remoteForm.localID)"><CopyDocument /></el-icon>
          </div>
        </div>
      </div>
      <div class="title">远程控制设备</div>
      <el-form ref="remoteFormRef" class="remote" :data="remoteForm">
        <el-form-item prop="remoteID">
          <el-input v-model="remoteForm.remoteID" style="max-width: 600px" />
          <el-button
            v-if="deviceStatus !== DeviceStatus.PUPPETEER"
            style="margin-left: 10px"
            type="primary"
            @click="requestRemote"
            >连接</el-button
          >
          <el-button
            v-if="deviceStatus === DeviceStatus.PUPPETEER"
            style="margin-left: 10px"
            type="danger"
            @click="disconnect"
            >断开</el-button
          >
        </el-form-item>
      </el-form>
      <!-- <el-button type="primary" @click="openWindow">打开窗口</el-button> -->
    </template>
    <div v-if="deviceStatus === DeviceStatus.CONTROLLER" class="video-container">
      <el-icon class="close-btn" @click="disconnect"><Close /></el-icon>
      <video
        tabindex="-1"
        width="100%"
        height="100%"
        autoplay
        @mousedown="mousedown"
        @mouseup="mouseup"
        @mousemove="mousemove"
        @mousewheel="mousewheel"
      ></video>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { io, Socket } from 'socket.io-client'
import useClipboard from 'vue-clipboard3'
import { createVideoRTC } from './RTC'
import { throttle } from '@renderer/utils'
import { DeviceStatus } from './type'
import { ElButton, ElNotification, FormInstance, NotificationHandle } from 'element-plus'
import { Check, Close } from '@element-plus/icons-vue'

const deviceStatus = ref(DeviceStatus.FREE)
const remoteFormRef = ref<FormInstance>()
const remoteForm = ref({
  localID: '',
  code: crypto.randomUUID(),
  remoteID: ''
})

let peer: RTCPeerConnection
let socket: Socket
window.electron.ipcRenderer.invoke('system_id').then(({ system_id, code }) => {
  remoteForm.value.localID = system_id
  remoteForm.value.code = code

  socket = io('http://10.2.0.36:3000')
  socket.on('connect', async () => {
    console.log('websocket 连接成功')
    peer = await createVideoRTC(socket, remoteForm)
    socket.emit('create', remoteForm.value.localID)

    // 收到对方请求
    socket.on('request', (uuid) => {
      if (deviceStatus.value !== DeviceStatus.FREE) {
        socket.emit('reply', {
          from: remoteForm.value.localID,
          to: remoteForm.value.remoteID,
          status: 'busy'
        })
        return
      }
      let notify: NotificationHandle | null = ElNotification({
        message: h('div', { style: 'width: 280px' }, [
          h('div', { style: 'color: teal' }, `设备【${uuid}】请求与你建立连接`),
          h('div', { style: 'display: flex; justify-content: space-around;' }, [
            h(ElButton, {
              type: 'success',
              text: true,
              icon: Check,
              onClick: () => notifyHandler(notify, 'agree')
            }),
            h(ElButton, {
              type: 'danger',
              text: true,
              icon: Close,
              onClick: () => notifyHandler(notify, 'disagree')
            })
          ])
        ]),
        duration: 0,
        showClose: false,
        position: 'bottom-right'
      })
      remoteForm.value.remoteID = uuid
    })

    socket.on('break', () => {
      if (deviceStatus.value === DeviceStatus.CONTROLLER) {
        const video = document.querySelector('video') as HTMLElement
        video.removeEventListener('keydown', keyboardHandler)
        video.removeEventListener('keyup', keyboardHandler)
      }
      Notification('warning', '对方已断开连接')
      disconnectRTC()
    })

    socket.on('reply', async (res) => {
      if (res.status === 'agree') {
        // 收到对方同意的回复
        deviceStatus.value = DeviceStatus.CONTROLLER
        Notification('success', `设备【${res.from}】同意与你建立连接`)

        nextTick(() => {
          const video = document.querySelector('video') as HTMLElement
          video.addEventListener('keydown', keyboardHandler)
          video.addEventListener('keyup', keyboardHandler)
        })

        dataChannel = peer.createDataChannel('keyboard', {
          ordered: false
        })
        dataChannel.onopen = () => {
          // console.log('dataChannel打开')
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
          from: remoteForm.value.localID,
          to: remoteForm.value.remoteID
        })
      } else if (res.status === 'disagree') {
        Notification('error', `设备【${res.from}】拒绝与你建立连接`)
      } else if (res.status === 'busy') {
        Notification('warning', `设备【${res.from}】正在连接中`)
      }
    })

    // 收到对方offer
    socket.on('offer', async (res) => {
      peer.ondatachannel = (event) => {
        dataChannel = event.channel
        dataChannel.onopen = () => {
          // console.log('dataChannel打开')
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
        from: remoteForm.value.localID,
        to: remoteForm.value.remoteID
      })
    })

    // 收到对方answer
    socket.on('answer', async (res) => {
      await peer.setRemoteDescription(res.answer)
    })

    // 收到对方candidate
    socket.on('candidate', async (res) => {
      // console.log(`收到candidate信息，发送方：${res.from}，接收方：${res.to}`)
      await peer.addIceCandidate(res.candidate) // 收到对方candidate后，都添加到自己的peer对象上
    })
  })

  socket.on('disconnect', () => {
    console.log('disconnected')
  })
})

const { toClipboard } = useClipboard()
const copy = async (text: string) => {
  try {
    await toClipboard(text)
    ElMessage.success('复制成功')
  } catch (e) {
    ElMessage.error('复制失败')
  }
}

// const openWindow = async () => {
//   await window.electron.ipcRenderer.invoke('open-remote')
// }

let dataChannel: RTCDataChannel | null
const mousemove = throttle(
  (e) => {
    const video = document.querySelector('video') as HTMLVideoElement
    const { width, height } = video.getBoundingClientRect()
    dataChannel?.send(JSON.stringify({ type: e.type, x: e.offsetX, y: e.offsetY, width, height }))
  },
  30,
  { immediate: true, tail: true }
)
const mousedown = (e) => {
  dataChannel?.send(JSON.stringify({ type: e.type, button: e.button }))
}
const mouseup = (e) => {
  dataChannel?.send(JSON.stringify({ type: e.type, button: e.button }))
}
const mousewheel = (e) => {
  dataChannel?.send(JSON.stringify({ type: e.type, deltaY: e.deltaY }))
}
const keyboardHandler = (e) => {
  dataChannel?.send(JSON.stringify({ type: e.type, code: e.code }))
}

const requestRemote = () => {
  if (remoteForm.value.localID === remoteForm.value.remoteID) {
    Notification('error', '不能远程控制本机设备')
    return
  }
  socket.emit('request', {
    from: remoteForm.value.localID,
    to: remoteForm.value.remoteID
  })
}

const notifyHandler = (notify: NotificationHandle | null, status: 'agree' | 'disagree') => {
  if (status === 'agree') deviceStatus.value = DeviceStatus.PUPPETEER
  socket.emit('reply', {
    from: remoteForm.value.localID,
    to: remoteForm.value.remoteID,
    status
  })
  notify?.close()
  notify = null
}

const disconnect = async () => {
  disconnectRTC()
  socket.emit('break', remoteForm.value.remoteID)
}

const disconnectRTC = async () => {
  deviceStatus.value = DeviceStatus.FREE
  dataChannel?.close()
  peer.close()
  dataChannel = null
  peer = await createVideoRTC(socket, remoteForm)
}

const Notification = (type: 'success' | 'warning' | 'info' | 'error' | '', message: string) => {
  ElNotification({
    title: '通知',
    type,
    dangerouslyUseHTMLString: true,
    message: `<div style="color: teal">${message}</div>`,
    showClose: false,
    position: 'bottom-right'
  })
}

onUnmounted(() => {
  socket.disconnect()
})
</script>

<style>
.title {
  font-size: 22px;
  font-weight: 700;
}
.local {
  display: flex;
  margin: 50px 0;
  .local-code {
    width: 50%;
    .code-name {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .code {
      color: teal;
      font-size: 24px;
      font-weight: 700;
    }
    .copy-btn {
      cursor: pointer;
      margin-left: 10px;
    }
  }
}
.remote {
  margin-top: 20px;
}
.video-container {
  padding-top: 20px;
  /* 相对定位 */
  position: relative;
  .close-btn {
    display: none;
    position: absolute;
    top: 0;
    right: 0;
    cursor: pointer;
    font-size: 20px;
  }
}

.video-container:hover .close-btn {
  display: block;
}
</style>
