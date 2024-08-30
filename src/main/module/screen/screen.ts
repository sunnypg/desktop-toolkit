import { BrowserWindow, desktopCapturer, webContents } from 'electron'

const selfWindows = async () =>
  await Promise.all(
    webContents
      .getAllWebContents()
      .filter((item) => {
        const win = BrowserWindow.fromWebContents(item)
        return win && win.isVisible()
      })
      .map(async (item) => {
        const win = BrowserWindow.fromWebContents(item)
        const thumbnail = await win?.capturePage()
        // 当程序窗口打开DevTool的时候  也会计入
        return {
          name: win?.getTitle() + (item.devToolsWebContents === null ? '' : '-dev'), // 给dev窗口加上后缀
          id: win?.getMediaSourceId(),
          thumbnail,
          display_id: '',
          appIcon: null
        }
      })
  )

export const getDesktopCapturerSource = async (type: 'screen' | 'window' = 'window') => {
  return [
    ...(await desktopCapturer.getSources({ types: ['screen'] })),
    ...(type === 'screen' ? [] : await selfWindows())
  ]
}
