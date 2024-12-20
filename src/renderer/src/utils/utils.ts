import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)

export function formatUTC(utcString: string, format: string = 'YYYY-MM-DD HH:mm:ss') {
  const resultTime = dayjs.utc(utcString).utcOffset(8).format(format)
  return resultTime
}

export function formatSizeUnits(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  let unitIndex = 0

  while (bytes >= 1024 && unitIndex < units.length - 1) {
    bytes /= 1024
    unitIndex++
  }

  return `${bytes.toFixed(2)} ${units[unitIndex]}`
}

export function throttle(fn, interval, { immediate = true, tail = false } = {}) {
  // 用来记录开始时间
  let start = 0
  let timer: any = null

  const _throttle = function (...args) {
    // 当前时间
    const nowTime = Date.now()

    // 首次是否立即执行
    if (!immediate && start === 0) start = nowTime

    // 消耗时间 = 当前时间 - 开始时间
    // 等待时间 = 间隔时间 - 消耗时间
    const waitTime = interval - (nowTime - start)

    // 如果等待时间 <= 0，说明可以执行了
    if (waitTime <= 0) {
      timer && clearTimeout(timer)
      // @ts-ignore
      fn.apply(this, args)
      start = nowTime // 最终执行完毕，把开始时间设置为当前时间
      timer = null
      return
    }

    // 判断是否需要执行尾部
    if (tail && !timer) {
      timer = setTimeout(() => {
        // @ts-ignore
        fn.apply(this, args)
        start = Date.now() //重置为最新时间，不能为nowTime
        timer = null
      }, waitTime)
    }
  }

  return _throttle
}
