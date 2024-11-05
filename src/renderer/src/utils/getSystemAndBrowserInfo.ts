export function getSystemAndBrowserInfo() {
  const userAgent = navigator.userAgent
  const info = {
    system: {
      name: '',
      version: ''
    },
    browser: {
      name: '',
      version: ''
    }
  }

  // 解析系统信息
  const systemRegex = /(Windows NT|Mac OS X|Linux|Android|iOS|X11)/
  const systemMatch = userAgent.match(systemRegex)
  if (systemMatch) {
    switch (systemMatch[0]) {
      case 'Windows NT':
        info.system.name = 'Windows'
        info.system.version = getWindowsVersion(userAgent)
        break
      case 'Mac OS X':
        info.system.name = 'macOS'
        info.system.version = getMacOSVersion(userAgent)
        break
      case 'Linux':
        info.system.name = 'Linux'
        info.system.version = 'Unknown'
        break
      case 'Android':
        info.system.name = 'Android'
        info.system.version = getAndroidVersion(userAgent)
        break
      case 'iOS':
        info.system.name = 'iOS'
        info.system.version = getIOSVersion(userAgent)
        break
      case 'X11':
        info.system.name = 'Unix'
        info.system.version = 'Unknown'
        break
      default:
        info.system.name = 'Unknown'
        info.system.version = 'Unknown'
    }
  }

  // 解析浏览器信息
  const browserRegex = /(Chrome|Firefox|Safari|Edg|MSIE|Trident)/
  const browserMatch = userAgent.match(browserRegex)
  if (browserMatch) {
    switch (browserMatch[0]) {
      case 'Chrome':
        info.browser.name = 'Chrome'
        info.browser.version = getBrowserVersion(userAgent, 'Chrome')
        break
      case 'Firefox':
        info.browser.name = 'Firefox'
        info.browser.version = getBrowserVersion(userAgent, 'Firefox')
        break
      case 'Safari':
        info.browser.name = 'Safari'
        info.browser.version = getBrowserVersion(userAgent, 'Version')
        break
      case 'Edg':
        info.browser.name = 'Edge'
        info.browser.version = getBrowserVersion(userAgent, 'Edg')
        break
      case 'MSIE':
        info.browser.name = 'Internet Explorer'
        info.browser.version = getBrowserVersion(userAgent, 'MSIE')
        break
      case 'Trident':
        info.browser.name = 'Internet Explorer'
        info.browser.version = getBrowserVersion(userAgent, 'rv:')
        break
      default:
        info.browser.name = 'Unknown'
        info.browser.version = 'Unknown'
    }
  }

  return info
}

function getWindowsVersion(userAgent) {
  const versionRegex = /Windows NT (\d+\.\d+)/
  const match = userAgent.match(versionRegex)
  if (match) {
    return match[1]
  }
  return 'Unknown'
}

function getMacOSVersion(userAgent) {
  const versionRegex = /Mac OS X (\d+_\d+(_\d+)?)/
  const match = userAgent.match(versionRegex)
  if (match) {
    return match[1].replace(/_/g, '.')
  }
  return 'Unknown'
}

function getAndroidVersion(userAgent) {
  const versionRegex = /Android (\d+\.\d+(\.\d+)?)/
  const match = userAgent.match(versionRegex)
  if (match) {
    return match[1]
  }
  return 'Unknown'
}

function getIOSVersion(userAgent) {
  const versionRegex = /OS (\d+_\d+(_\d+)?)/
  const match = userAgent.match(versionRegex)
  if (match) {
    return match[1].replace(/_/g, '.')
  }
  return 'Unknown'
}

function getBrowserVersion(userAgent, browserName) {
  const versionRegex = new RegExp(`${browserName}\\/([\\d.]+)`)
  const match = userAgent.match(versionRegex)
  if (match) {
    return match[1]
  }
  return 'Unknown'
}
