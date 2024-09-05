enum StorageType {
  local,
  Session
}

class myStorage {
  storage: Storage

  constructor(type: StorageType) {
    this.storage = type === StorageType.local ? localStorage : sessionStorage
  }

  setStorage(key: string, value: any) {
    if (value || typeof value === 'boolean') {
      this.storage.setItem(key, JSON.stringify(value))
    }
  }

  getStorage(key: string) {
    const value = this.storage.getItem(key)
    if (value) {
      return JSON.parse(value)
    }
  }

  deleteStorage(key: string) {
    this.storage.removeItem(key)
  }

  clearStorage() {
    this.storage.clear()
  }
}

const myLocalStorage = new myStorage(StorageType.local)
const mySessionStorage = new myStorage(StorageType.Session)

export { myLocalStorage, mySessionStorage }
