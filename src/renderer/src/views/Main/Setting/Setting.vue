<template>
  <div class="setting">
    <el-card>
      <template #header>
        <div style="font-weight: 700; font-size: 20px">设置</div>
      </template>
      <el-button type="primary" @click="dispatch('download')">下载</el-button>
      <el-button type="primary" @click="dispatch('open_chromium')">打开</el-button>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import FingerprintJS from '@fingerprintjs/fingerprintjs'
import FakeFingerPrint from 'fake-fingerprint'

const dispatch = (type) => {
  window.electron.ipcRenderer.send(type)
}

const instance = new FakeFingerPrint({
  config: {
    /* 浏览器的navigator对象. 能够对它的一些属性进行自定义配置. */
    navigator: {
      userAgent:
        'Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.6367.79 Safari/537.36',
      appName: 'aaa'
      // 更多的navigator属性
    },
    /* 浏览器的screen对象. 能够对它的一些属性进行自定义配置. */
    screen: {
      width: 888,
      height: 123
      // 更多的screen属性
    },
    canvas: {
      fillText: 'hello fake'
    },
    audio: {
      strength: 100
    },
    timezone: {
      zone: 'America/New_York',
      locale: 'en-US',
      offset: -5
    },
    webGL: {
      driver: 'ANGLE (NVIDIA GeForce GTX 1050 Ti Direct3D11 vs_5_0 ps_5_0)'
    },
    webRTC: {
      address: '127.0.0.1'
    }
  },
  /*
   当调用修改的方法或访问代理的属性时报告
    例如:{type:'navigator',key:'UserAgent'}
  */
  report: (arg) => {
    console.log('arg:', arg)
  },
  /* 当这些属性被访问的时候进行报告  */
  // reportKeys: ['userAgent', 'appVersion', 'toDataURL']
  reportKeys: []
})

instance.open()

const fpPromise = FingerprintJS.load()
;(async () => {
  const fp = await fpPromise
  const result = await fp.get()
  console.log(result.visitorId)
})()
</script>

<style lang="less" scoped></style>
