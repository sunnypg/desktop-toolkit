interface bookmarksItem {
  title: string
  url: string
}

export interface IBrowser {
  id: string
  name: string
  urls: string[]
  note?: string
  system: string
  UA: string
  userAgent: string
  userDataDir: string
  proxyUrl?: string
  webgl?: boolean
  bookmarks?: bookmarksItem[]
}
