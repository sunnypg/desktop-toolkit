interface OptionsItem {
  label: string
  value: string
  disabled?: boolean
}

export const WindowsOptions: OptionsItem[] = [
  {
    label: 'All Windows',
    value: 'Windows NT 10.0'
  },
  {
    label: 'Windows 11',
    value: 'Windows NT 10.0'
  },
  {
    label: 'Windows 10',
    value: 'Windows NT 10.0'
  },
  {
    label: 'Windows 8',
    value: 'Windows NT 6.2'
  },
  {
    label: 'Windows 7',
    value: 'Windows NT 6.1'
  }
]

export const UAOptions: OptionsItem[] = [
  {
    label: '全部',
    value: '122.0.6261.112'
  },
  {
    label: 'UA 124',
    value: '124.0.6367.79'
  },
  {
    label: 'UA 123',
    value: '123.0.6312.58'
  },
  {
    label: 'UA 122',
    value: '122.0.6261.57'
  },
  {
    label: 'UA 121',
    value: '121.0.6167.185'
  },
  {
    label: 'UA 120',
    value: '120.0.6099.199'
  },
  {
    label: 'UA 119',
    value: '119.0.6045.120'
  },
  {
    label: 'UA 118',
    value: '118.0.5993.70'
  }
]

export const proxyTypes: OptionsItem[] = [
  {
    label: 'No Proxy(本地直连)',
    value: 'NoProxy'
  },
  {
    label: 'SSH',
    value: 'ssh'
  },
  {
    label: 'HTTPS',
    value: 'https'
  },
  {
    label: 'HTTP',
    value: 'http'
  },
  {
    label: 'Socks5',
    value: 'socks5'
  },
  {
    label: 'IPFoxy(IPFoxy静态独享)',
    value: 'IPFoxy',
    disabled: true
  },
  {
    label: 'IPFoxyauto(IPFoxy动态代理)',
    value: 'IPFoxyauto',
    disabled: true
  },
  {
    label: 'Lumauto(Luminati动态代理)',
    value: 'Luminati',
    disabled: true
  }
]
