<template>
  <el-card>
    <div class="title">允许控制本设备</div>
    <div class="local">
      <div class="local-code">
        <div class="code-name">本机设备识别码</div>
        <div>
          <span class="code">{{
            `${localID.substring(0, 3)} ${localID.substring(3, 6)} ${localID.substring(6, 9)}`
          }}</span>
          <el-icon class="copy-btn" @click="copy(localID)"><CopyDocument /></el-icon>
        </div>
      </div>
      <div class="local-code">
        <div class="code-name">长期验证码</div>
        <div>
          <span v-if="showCode" class="code">{{
            `${localCode.substring(0, 3)} ${localCode.substring(3, 6)}`
          }}</span>
          <span v-else class="code">* * * * * *</span>
          <el-icon style="cursor: pointer; margin-left: 10px" @click="showCode = !showCode">
            <component :is="showCode ? Hide : View"></component>
          </el-icon>
          <el-icon v-if="showCode" class="copy-btn" @click="copy(localCode)"
            ><CopyDocument
          /></el-icon>
        </div>
      </div>
    </div>
    <div class="title">远程控制设备</div>
    <el-form ref="remoteFormRef" class="remote" :data="remoteForm">
      <el-form-item prop="remoteID">
        <el-input
          v-model="remoteForm.remoteID"
          placeholder="请输入伙伴识别码"
          clearable
          style="width: 60%"
          class="remote-input"
        >
          <template #append>
            <el-input
              v-model="remoteForm.remoteCode"
              type="password"
              show-password
              clearable
              placeholder="验证码（可为空）"
              style="width: 150px"
            />
          </template>
        </el-input>

        <el-button
          style="margin-left: 10px"
          :disabled="!remoteForm.remoteID"
          type="primary"
          @click="requestRemote"
          >连接</el-button
        >
      </el-form-item>
    </el-form>
    <!-- <el-button type="primary" @click="openWindow">打开窗口</el-button> -->
    <div class="remote-list">
      <div v-if="remoteList.length" style="width: 100%">
        <h3>您已控制的设备</h3>
        <el-table :data="remoteList">
          <el-table-column prop="remote_id" label="设备码" />
          <el-table-column label="操作">
            <template #default="{ row }">
              <el-button
                v-if="row.status === 'hide'"
                type="primary"
                size="small"
                @click="handleWindle(row, 'show')"
                >显示</el-button
              >
              <el-button
                v-if="row.status === 'show'"
                type="info"
                size="small"
                @click="handleWindle(row, 'hide')"
                >隐藏</el-button
              >
              <el-button type="danger" size="small" @click="handleWindle(row, 'close')"
                >断开</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-if="controlledList.length" style="width: 100%">
        <h3>正在控制您的设备</h3>
        <el-table :data="controlledList">
          <el-table-column prop="remote_id" label="设备码" />
          <el-table-column label="操作">
            <template #default="{ row }">
              <el-button type="danger" size="small" @click="turnOff(row.remote_id)">断开</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { io, Socket } from 'socket.io-client'
import useClipboard from 'vue-clipboard3'
import { createVideoRTC } from './RTC'
import { ElNotification, FormInstance, NotificationHandle } from 'element-plus'
import { Check, Close, Hide, View } from '@element-plus/icons-vue'

const localID = ref('')
const localCode = ref('')
const showCode = ref(false)
const remoteFormRef = ref<FormInstance>()
const remoteForm = ref({
  remoteID: '',
  remoteCode: ''
})

const remoteList = ref<any[]>([])
const controlledList = ref<any[]>([])

let peerMap: Map<string, RTCPeerConnection> = new Map()
let channelMap: Map<string, RTCDataChannel> = new Map()
let socket: Socket
window.electron.ipcRenderer.invoke('id_code').then(({ system_id, code }) => {
  localID.value = system_id
  // localID.value = crypto.randomUUID()
  localCode.value = code

  socket = io('http://10.2.0.36:3000')
  socket.on('connect', async () => {
    console.log('websocket 连接成功')
    socket.emit('create', localID.value)

    // 收到对方请求
    socket.on('request', async ({ from, code }) => {
      // 检测是否已经控制对方
      if (remoteList.value.find((item) => item.remote_id === from)) {
        socket.emit('reply', {
          from: localID.value,
          to: from,
          status: 'controlled'
        })
        return
      }

      // 检测验证码是否正确
      if (code === localCode.value) {
        socket.emit('reply', {
          from: localID.value,
          to: from,
          status: 'agree',
          code: localCode.value
        })
        controlledList.value.push({
          remote_id: from
        })
        return
      }

      let notify: NotificationHandle | null = ElNotification({
        message: h('div', { style: 'width: 280px' }, [
          h('div', { style: 'color: teal' }, `设备【${from}】请求与你建立连接`),
          h('div', { style: 'display: flex; justify-content: space-around;' }, [
            h(ElButton, {
              type: 'success',
              text: true,
              icon: Check,
              onClick: () => notifyHandler(notify, from, 'agree')
            }),
            h(ElButton, {
              type: 'danger',
              text: true,
              icon: Close,
              onClick: () => notifyHandler(notify, from, 'disagree')
            })
          ])
        ]),
        duration: 0,
        showClose: false,
        position: 'bottom-right'
      })
    })

    socket.on('reply', async ({ from, status, code }) => {
      if (status === 'agree') {
        // 收到对方同意的回复
        Notification('success', `设备【${from}】同意与你建立连接`)
        window.electron.ipcRenderer.invoke('open-window', {
          route: 'remote',
          remote_id: from,
          code
        })
        remoteList.value.push({
          remote_id: from,
          status: 'show'
        })
      } else if (status === 'disagree') {
        Notification('error', `设备【${from}】拒绝与你建立连接`)
      } else if (status === 'controlled') {
        Notification('warning', `设备【${from}】正在控制本机`)
      }
    })

    // 控制方已打开远程控制窗口
    socket.on('finish', async ({ from: remoteID, code }) => {
      if (code !== localCode.value) {
        socket.emit('reply', {
          from: localID.value,
          to: remoteID,
          status: 'code-error'
        })
        return
      }
      const { peer, screenData } = await createVideoRTC(socket, localID.value, remoteID)
      peerMap.set(remoteID, peer)

      const channel = peer.createDataChannel(remoteID)
      channelMap.set(remoteID, channel)

      channel.onopen = () => {
        channel.send(JSON.stringify(screenData))
      }

      channel.onmessage = (event) => {
        const data = JSON.parse(event.data)
        switch (data.type) {
          case 'mousemove':
            // ElMessage.success(`移动到位置：X:${data.x}，Y:${data.y}`)
            window.electron.ipcRenderer.send('mouse-move', data)
            break
          case 'mousedown':
            // ElMessage.success(`按下【${data.button}】`)
            window.electron.ipcRenderer.send('mouse-event', data)
            break
          case 'mouseup':
            // ElMessage.success(`抬起【${data.button}】`)
            window.electron.ipcRenderer.send('mouse-event', data)
            break
          case 'mousewheel':
            // ElMessage.success(`滚动了：X:${data.deltaY}`)
            window.electron.ipcRenderer.send('mouse-event', data)
            break
          case 'keydown':
            // ElMessage.success(`按下了【${data.code}】键`)
            window.electron.ipcRenderer.send('keyboard-event', data)
            break
          case 'keyup':
            // ElMessage.success(`抬起了【${data.code}】键`)
            window.electron.ipcRenderer.send('keyboard-event', data)
            break
          default:
            break
        }
      }

      let offer = await peer.createOffer()
      await peer.setLocalDescription(offer)
      socket.emit('offer', {
        offer,
        from: localID.value,
        to: remoteID
      })
    })

    socket.on('answer', async ({ from, answer }) => {
      const peer = peerMap.get(from)
      await peer?.setRemoteDescription(answer)
    })

    socket.on('candidate', async ({ from, candidate }) => {
      const peer = peerMap.get(from)
      await peer?.addIceCandidate(candidate)
    })

    socket.on('leave', async ({ from }) => {
      // 判断是否是远程设备
      const remoteItem = remoteList.value.find((item) => item.remote_id === from)
      if (remoteItem) {
        remoteList.value = remoteList.value.filter((item) => item.remote_id !== from)
        window.electron.ipcRenderer.invoke('window-handle', { id: from, type: 'close' })
        Notification('warning', '对方已断开连接')
      } else {
        controlledList.value = controlledList.value.filter((item) => item.remote_id !== from)
        peerMap.delete(from)
        channelMap.delete(from)
        Notification('warning', '对方已断开连接')
      }
    })
  })

  socket.on('disconnect', () => {
    console.log('disconnected')
  })
})

window.electron.ipcRenderer.on('remote-close', (_, id) => {
  remoteList.value = remoteList.value.filter((item) => item.remote_id !== id)
  socket.emit('leave', { from: localID.value, to: id })
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
//   await window.electron.ipcRenderer.invoke('open-window', { route: '/main/control' })
// }

const handleWindle = async (row, type) => {
  await window.electron.ipcRenderer.invoke('window-handle', { id: row.remote_id, type })
  row.status = type
  if (type === 'close') {
    remoteList.value = remoteList.value.filter((item) => item.remote_id !== row.remote_id)
    socket.emit('leave', { from: localID.value, to: row.remote_id })
  }
}

const turnOff = (id) => {
  controlledList.value = controlledList.value.filter((item) => item.remote_id !== id)
  peerMap.delete(id)
  channelMap.delete(id)
  socket.emit('leave', { from: localID.value, to: id })
}

const requestRemote = () => {
  if (localID.value === remoteForm.value.remoteID) {
    Notification('error', '不能远程控制本机设备')
    return
  }
  if (remoteList.value.find((item) => item.remote_id === remoteForm.value.remoteID)) {
    Notification('error', '您正在控制此设备，请打开远程控制窗口')
    return
  }
  socket.emit('request', {
    from: localID.value,
    to: remoteForm.value.remoteID,
    code: remoteForm.value.remoteCode
  })
}

const notifyHandler = async (
  notify: NotificationHandle | null,
  to: string,
  status: 'agree' | 'disagree'
) => {
  if (status === 'agree') {
    controlledList.value.push({
      remote_id: to
    })
  }
  socket.emit('reply', {
    from: localID.value,
    to,
    status,
    ...(status === 'agree' ? { code: localCode.value } : {})
  })
  notify?.close()
  notify = null
}

const Notification = (type: 'success' | 'warning' | 'info' | 'error' | '', message: string) => {
  const titleMap = {
    success: '通知',
    warning: '警告',
    info: '提示',
    error: '拒绝'
  }
  ElNotification({
    title: titleMap[type],
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
  .remote-input .el-input-group__append {
    padding: 0;
  }
}
.remote-list {
  display: flex;
}
</style>
