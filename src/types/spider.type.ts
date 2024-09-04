export interface IProgress {
  status: string
  message: string
  progress: number
  type_progress: string
  type: string
  current: number
  total: number
}

export interface SpiderOptions {
  urls: string[]
  savePath: string
  headless: boolean
  chromePath: string
}
