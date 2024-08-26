import { Socket } from 'socket.io-client'
import { Ref } from 'vue'

export async function createVideoRTC(
  socket: Socket,
  remoteForm: Ref<{
    localID: string
    remoteID: string
  }>
): Promise<RTCPeerConnection> {
  const peer: RTCPeerConnection = new RTCPeerConnection()
  peer.onicecandidate = ({ candidate }) => {
    if (candidate) {
      console.log('获取到candidate信息', candidate)
      // 通过信令服务器发送candidate信息给对方用户
      socket.emit('candidate', {
        from: remoteForm.value.localID,
        to: remoteForm.value.remoteID,
        candidate: candidate
      })
    }
  }

  const sources = await window.electron.ipcRenderer.invoke('screen-sources') // 添加本地窗口信息
  // 添加本地屏幕视频流
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      // @ts-ignore
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: sources[0].id,
        maxFrameRate: 60
      }
    }
  })

  stream.getTracks().forEach((track) => {
    peer.addTrack(track, stream)
  })

  return peer
}
