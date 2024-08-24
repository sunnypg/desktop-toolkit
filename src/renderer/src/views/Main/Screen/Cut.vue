<script setup lang="ts">
import ScreenShot from 'js-web-screen-shot'

onMounted(async () => {
  const sources = await window.electron.ipcRenderer.invoke('screen-sources')
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        // @ts-ignore
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: sources[0].id
        }
      }
    })
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
  } catch (error) {
    console.log(error)
  }
})

const dispatch = async (action, info?) => {
  window.electron.ipcRenderer.send('screenshot-callback', JSON.stringify({ action, info }))
}
</script>
