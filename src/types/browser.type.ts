interface bookmarksItem {
  title: string
  url: string
}

export interface IBrowser {
  id: string
  name: string
  chromePath: string
  urls: string[]
  note?: string
  system: string
  UA: string
  userAgent: string
  userDataDir: string
  proxyUrl?: string
  disable_webgl?: boolean
  webgl_mode: 'none' | 'explicit' | 'implicit'
  bookmarks?: bookmarksItem[]
}
