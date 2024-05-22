<script setup lang="ts">
import ScreenShot from 'js-web-screen-shot'

const getSource = async () => {
  const sources = await window.electron.ipcRenderer.invoke('screenshot-sources')
  const stream = await getInitStream(sources[0])
  new ScreenShot({
    enableWebRtc: true, // 启用webrtc
    screenFlow: stream!, // 传入屏幕流数据
    clickCutFullScreen: true, // 单击截全屏
    level: 999,
    completeCallback: ({ base64, cutInfo }) => {
      dispatch('complete', { base64, cutInfo })
    },
    closeCallback: () => {
      dispatch('close')
    },
    saveCallback: (code, msg) => {
      dispatch('save', { code, msg })
    }
  })
}

const dispatch = async (action, info?) => {
  window.electron.ipcRenderer.send('screenshot-callback', JSON.stringify({ action, info }))
}

getSource()

function getInitStream(source: any): Promise<MediaStream | null> {
  return new Promise((resolve, _reject) => {
    // 获取指定窗口的媒体流
    // 此处遵循的是webRTC的接口类型  暂时TS类型没有支持  只能断言成any
    ;(navigator.mediaDevices as any)
      .getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: source.id
          }
        }
      })
      .then((stream: MediaStream) => {
        resolve(stream)
      })
      .catch((error: any) => {
        console.log(error)
        resolve(null)
      })
  })
}
</script>
