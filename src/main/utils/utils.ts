import { screen } from 'electron'
const fs = require('fs').promises

export function checkDirectory(path) {
  return new Promise(async (resolve, reject) => {
    try {
      await fs.access(path)
      resolve(true)
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        resolve(false)
      } else {
        reject(err)
      }
    }
  })
}

export function getSize() {
  const { size, scaleFactor } = screen.getPrimaryDisplay()
  return {
    width: size.width * scaleFactor,
    height: size.height * scaleFactor
  }
}
