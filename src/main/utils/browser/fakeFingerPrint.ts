// import FingerprintJS from '@fingerprintjs/fingerprintjs'
// import FakeFingerPrint from 'fake-fingerprint'

export default async function fakeFingerPrint(page: any) {
  return await page.evaluate(() => {
    // 修改浏览器指纹
  })
}
