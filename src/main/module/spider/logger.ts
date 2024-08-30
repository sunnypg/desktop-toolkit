const { createLogger, transports, format } = require('winston')
const { combine, timestamp, align, padLevels, printf } = format

export default class Logger {
  savePath: string
  logger: any
  constructor(options) {
    this.savePath = options.savePath
    this.init()
  }
  private init() {
    // 定义一个格式化器
    const Formater = printf((info) => {
      const { level, timestamp, message, url, err } = info
      return `${timestamp} | ${level}: ${message} | URL: ${url} | ORIGIN_ERROR: ${err.message}`
    })

    // 创建一个logger实例
    this.logger = createLogger({
      level: 'info',
      format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), align(), padLevels(), Formater),
      transports: [
        // 将日志写入文件
        new transports.File({ filename: this.savePath })
      ]
    })
  }

  error(url: string, message: string, err: any) {
    this.logger.error({ url, message, err })
  }
}
