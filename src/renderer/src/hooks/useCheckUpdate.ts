import { formatSizeUnits } from '@renderer/utils/utils'

export default function useCheckUpdate(callback?: (res: any) => void) {
  const checkStatus = ref(false)

  window.electron.ipcRenderer.on('updater-event', (_, res) => {
    switch (res.event) {
      case 'checking-for-update':
        // 正在检查是否有新版本...
        checkStatus.value = true
        break
      case 'update-available':
        // 发现新版本，是否需要立即下载？
        checkStatus.value = false
        callback?.(res)
        break
      case 'update-not-available':
        // 当前为最新版本，无需更新
        checkStatus.value = false
        callback?.(res)
        break
      case 'download-progress':
        // 正在下载新版本安装包...
        res.data.total = formatSizeUnits(res.data.total)
        res.data.bytesPerSecond = formatSizeUnits(res.data.bytesPerSecond) + '/s'
        res.data.percent = parseFloat(res.data.percent.toFixed(2))
        callback?.(res)
        break
      case 'update-downloaded':
        // 更新下载完成，应用将退出并进行安装
        callback?.(res)
        break
      default:
        break
    }
  })

  return { checkStatus }
}
