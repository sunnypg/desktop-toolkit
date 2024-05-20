/// <reference types="chrome"/>
import { IBrowser } from '../../../types/browser.type'

export default async function setBookmarks(page: any, bookmarks: IBrowser['bookmarks'] = []) {
  return await page.evaluate(async (bookmarks: IBrowser['bookmarks'] = []) => {
    function removeAllBookmarks() {
      return new Promise((resolve, reject) => {
        chrome.bookmarks.getTree(async (bookmarkTree) => {
          try {
            for (const node of bookmarkTree) {
              await deleteBookmarkNode(node)
            }
            resolve('所有书签已成功删除')
          } catch (error) {
            reject('删除书签时出错：' + error)
          }
        })
      })
    }

    async function deleteBookmarkNode(bookmarkNode) {
      if (bookmarkNode.children) {
        for (const child of bookmarkNode.children) {
          await deleteBookmarkNode(child)
        }
      }
      try {
        await new Promise((resolve, reject) => {
          chrome.bookmarks.remove(bookmarkNode.id, (result) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError.message)
            } else {
              resolve(result)
            }
          })
        })
      } catch (error) {
        console.error(`删除书签节点失败: ${error}`)
      }
    }

    await removeAllBookmarks()

    bookmarks.forEach((item) => {
      chrome.bookmarks.search(item, async (results) => {
        if (results.length === 0) {
          chrome.bookmarks.create({
            parentId: '1',
            ...item
          })
        }
      })
    })
  }, bookmarks)
}
