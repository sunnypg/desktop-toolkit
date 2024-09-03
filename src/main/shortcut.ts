import { globalShortcut } from 'electron'
import { screenshot } from './module/screen/screenshot'
import { onRecordingStart, stopRecording } from './module/screen/recording'

interface Shortcut {
  key: string
  callback: () => any
}

export default function registerGlobalShortcut() {
  const shortcutList: Shortcut[] = [
    {
      key: 'CommandOrControl+Q',
      callback: screenshot
    },
    {
      key: 'CommandOrControl+R',
      callback: onRecordingStart
    },
    {
      key: 'CommandOrControl+T',
      callback: stopRecording
    }
  ]

  shortcutList.forEach((item) => {
    globalShortcut.register(item.key, item.callback)
  })
}
