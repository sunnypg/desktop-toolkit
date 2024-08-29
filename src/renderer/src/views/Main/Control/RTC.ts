import { Socket } from 'socket.io-client'

export async function createVideoRTC(
  socket: Socket,
  localID: string,
  remoteID: string
): Promise<{ peer: RTCPeerConnection; screenData: any }> {
  const peer: RTCPeerConnection = new RTCPeerConnection()
  peer.onicecandidate = ({ candidate }) => {
    if (candidate) {
      console.log('获取到candidate信息', candidate)
      // 通过信令服务器发送candidate信息给对方用户
      socket.emit('candidate', {
        from: localID,
        to: remoteID,
        candidate: candidate
      })
    }
  }

  const sources = await window.electron.ipcRenderer.invoke('screen-sources', 'screen') // 获取所有屏幕源信息
  const screens = await window.electron.ipcRenderer.invoke('all_screen_size') // 获取所有屏幕尺寸

  // 获取所有屏幕视频流
  const streams = await Promise.all(
    sources.map(async (source) =>
      navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          // @ts-ignore
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: source.id,
            maxFrameRate: 60
          }
        }
      })
    )
  )
  // 添加屏幕视频流
  const screenData = streams.map((stream, index) => {
    stream.getTracks().forEach((track) => {
      peer.addTrack(track, stream)
    })
    return {
      name: sources[index].name,
      width: screens[index].size.width,
      height: screens[index].size.height,
      stream_id: stream.id
    }
  })

  return { peer: peer, screenData }
}
