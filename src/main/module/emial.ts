const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 587,
  secure: false,
  auth: {
    user: import.meta.env.MAIN_VITE_EMAIL,
    pass: import.meta.env.MAIN_VITE_EMAIL_PASSWORD
  }
})

export function convertMillisecondsToTime(milliseconds: number) {
  // 将毫秒转换为秒
  const seconds = Math.floor(milliseconds / 1000)
  // 计算小时
  const hours = Math.floor(seconds / 3600)
  // 剩余的秒数
  const remainingSeconds = seconds % 3600
  // 计算分钟
  const minutes = Math.floor(remainingSeconds / 60)
  // 剩余的秒数
  const finalSeconds = remainingSeconds % 60

  let hourStr = ''
  let minuteStr = ''
  let secondStr = ''
  hours && (hourStr = hours + '小时')
  minutes && (minuteStr = minutes + '分钟')
  finalSeconds && (secondStr = finalSeconds + '秒')

  return hourStr + minuteStr + secondStr
}

export async function sendEmailCode(email: string, code: string, validTime: number) {
  const time = convertMillisecondsToTime(validTime)
  const info = await transporter.sendMail({
    from: `"Desktop Toolkit 👻" <${import.meta.env.MAIN_VITE_EMAIL}>`,
    to: email,
    subject: '邮箱绑定',
    text: `您的邮箱验证码是：${code}，有效时间为${time}`
  })

  return {
    messageId: info.messageId,
    expiry: Date.now() + validTime
  }
}
