;(function (global) {
  const getStorage = () => {
    try {
      if (typeof window === 'undefined' || !('localStorage' in window)) return null
      const testKey = '__urza_storage_test__'
      window.localStorage.setItem(testKey, '1')
      window.localStorage.removeItem(testKey)
      return window.localStorage
    } catch (error) {
      return null
    }
  }

  const storage = getStorage()

  const isStorageAvailable = () => Boolean(storage)

  const setItem = (key, value) => {
    if (!storage || !key) return false
    try {
      storage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      if (error && error.name === 'QuotaExceededError') {
        console.warn('LocalStorage quota exceeded')
      }
      return false
    }
  }

  const getItem = (key, defaultValue = null) => {
    if (!storage || !key) return defaultValue
    try {
      const raw = storage.getItem(key)
      return raw == null ? defaultValue : JSON.parse(raw)
    } catch (error) {
      return defaultValue
    }
  }

  const removeItem = (key) => {
    if (!storage || !key) return false
    try {
      storage.removeItem(key)
      return true
    } catch (error) {
      return false
    }
  }

  const clearStorage = () => {
    if (!storage) return false
    try {
      storage.clear()
      return true
    } catch (error) {
      return false
    }
  }

  const getAllKeys = () => {
    if (!storage) return []
    try {
      return Object.keys(storage)
    } catch (error) {
      return []
    }
  }

  const hasKey = (key) => {
    if (!storage || !key) return false
    return storage.getItem(key) !== null
  }

  const setWithExpiry = (key, value, ttl) => {
    if (typeof ttl !== 'number' || ttl <= 0) return false
    const payload = {
      value,
      expiry: Date.now() + ttl
    }
    return setItem(key, payload)
  }

  const getWithExpiry = (key, defaultValue = null) => {
    const payload = getItem(key)
    if (!payload || typeof payload !== 'object') return defaultValue
    const { value, expiry } = payload
    if (typeof expiry !== 'number') return defaultValue
    if (Date.now() > expiry) {
      removeItem(key)
      return defaultValue
    }
    return value
  }

  const StorageUtil = {
    isStorageAvailable,
    setItem,
    getItem,
    removeItem,
    clearStorage,
    getAllKeys,
    hasKey,
    setWithExpiry,
    getWithExpiry
  }

  global.StorageUtil = StorageUtil
})(window)
