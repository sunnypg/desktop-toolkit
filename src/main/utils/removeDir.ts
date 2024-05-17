const fs = require('fs'),
  path = require('path')

/**
 * 删除文件夹功能
 * @param  {String} url  文件路径，绝对路径
 * @return {Null}
 */
export default function removeDir(url: string) {
  let files = []

  if (fs.existsSync(url)) {
    //判断给定的路径是否存在

    files = fs.readdirSync(url) //返回文件和子目录的数组
    files.forEach(function (file) {
      const curPath = path.join(url, file)

      if (fs.statSync(curPath).isDirectory()) {
        //同步读取文件夹文件，如果是文件夹，则函数回调
        removeDir(curPath)
      } else {
        fs.unlinkSync(curPath) //是指定文件，则删除
      }
    })

    fs.rmdirSync(url) //清除文件夹
  } else {
    console.log('给定的路径不存在！')
  }
}
