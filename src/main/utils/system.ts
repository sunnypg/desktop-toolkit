import os from 'os'
import * as nodeDiskInfo from 'node-disk-info'

function bytesToGB(bytes) {
  const gb = bytes / (1024 * 1024 * 1024)
  return gb.toFixed(2)
}

// cpu信息
export function getCpuInfo() {
  const cpus = os.cpus()
  const cpuInfo = cpus.reduce(
    (info, cpu) => {
      info.cpuNum += 1
      info.user += cpu.times.user
      info.sys += cpu.times.sys
      info.idle += cpu.times.idle
      info.total += cpu.times.user + cpu.times.sys + cpu.times.idle
      return info
    },
    { user: 0, sys: 0, idle: 0, total: 0, cpuNum: 0 }
  )
  return [
    { property: '核心数', value: cpuInfo.cpuNum },
    { property: '系统占用率', value: Number(((cpuInfo.sys / cpuInfo.total) * 100).toFixed(2)) },
    { property: '用户占用率', value: Number(((cpuInfo.user / cpuInfo.total) * 100).toFixed(2)) },
    { property: '当前空闲率', value: Number(((cpuInfo.idle / cpuInfo.total) * 100).toFixed(2)) }
  ]
}

// 内存信息
export function getMemory() {
  const totalMemory = os.totalmem()
  const freeMemory = os.freemem()
  const usedMemory = totalMemory - freeMemory
  const memoryUsagePercentage = (((totalMemory - freeMemory) / totalMemory) * 100).toFixed(2)
  return [
    { property: '总内存', value: bytesToGB(totalMemory) + 'GB' },
    { property: '已用内存', value: bytesToGB(usedMemory) + 'GB' },
    { property: '剩余内存', value: bytesToGB(freeMemory) + 'GB' },
    { property: '使用率', value: Number(memoryUsagePercentage) }
  ]
}

// 磁盘信息
export function getSysDisk() {
  const disks = nodeDiskInfo.getDiskInfoSync()
  return disks.map((disk: any) => {
    return {
      dirName: disk._mounted,
      typeName: disk._filesystem,
      total: bytesToGB(disk._blocks) + 'GB',
      used: bytesToGB(disk._used) + 'GB',
      free: bytesToGB(disk._available) + 'GB',
      usage: Number(((disk._used / disk._blocks || 0) * 100).toFixed(2))
    }
  })
}

// 其他信息
function getServerIP() {
  const nets = os.networkInterfaces() // 网卡信息
  let ip: string = ''
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      if (net.family === 'IPv4' && !net.internal) {
        ip = net.address
        break
      }
    }
  }
  return ip
}
export const getSysInfo = function getSysInfo() {
  return {
    computerName: os.hostname(), // 主机名
    computerIp: getServerIP(), // IP
    osName: os.platform(), // 操作系统
    osArch: os.arch() // 系统架构
  }
}
