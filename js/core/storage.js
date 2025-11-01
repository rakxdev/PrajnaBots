/**
 * Local Storage Core Module
 * Handles browser localStorage and sessionStorage operations
 */

// Storage keys
export const STORAGE_KEYS = {
  USER_SESSION: 'urza_user_session',
  USER_PREFERENCES: 'urza_user_preferences',
  THEME: 'urza_theme',
  DEVICE_DATA: 'urza_device_data',
  CACHED_DATA: 'urza_cached_data',
  LAST_SYNC: 'urza_last_sync',
  REDIRECT_URL: 'urza_redirect_url'
};

/**
 * Save data to localStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store (will be JSON stringified)
 * @returns {boolean} Success status
 */
export function saveToLocal(key, value) {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error('Save to localStorage error:', error);
    return false;
  }
}

/**
 * Get data from localStorage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {*} Retrieved value or default
 */
export function getFromLocal(key, defaultValue = null) {
  try {
    const serialized = localStorage.getItem(key);
    if (serialized === null) {
      return defaultValue;
    }
    return JSON.parse(serialized);
  } catch (error) {
    console.error('Get from localStorage error:', error);
    return defaultValue;
  }
}

/**
 * Remove data from localStorage
 * @param {string} key - Storage key
 * @returns {boolean} Success status
 */
export function removeFromLocal(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Remove from localStorage error:', error);
    return false;
  }
}

/**
 * Clear all data from localStorage
 * @returns {boolean} Success status
 */
export function clearLocal() {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('Clear localStorage error:', error);
    return false;
  }
}

/**
 * Save data to sessionStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store (will be JSON stringified)
 * @returns {boolean} Success status
 */
export function saveToSession(key, value) {
  try {
    const serialized = JSON.stringify(value);
    sessionStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error('Save to sessionStorage error:', error);
    return false;
  }
}

/**
 * Get data from sessionStorage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {*} Retrieved value or default
 */
export function getFromSession(key, defaultValue = null) {
  try {
    const serialized = sessionStorage.getItem(key);
    if (serialized === null) {
      return defaultValue;
    }
    return JSON.parse(serialized);
  } catch (error) {
    console.error('Get from sessionStorage error:', error);
    return defaultValue;
  }
}

/**
 * Remove data from sessionStorage
 * @param {string} key - Storage key
 * @returns {boolean} Success status
 */
export function removeFromSession(key) {
  try {
    sessionStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Remove from sessionStorage error:', error);
    return false;
  }
}

/**
 * Clear all data from sessionStorage
 * @returns {boolean} Success status
 */
export function clearSession() {
  try {
    sessionStorage.clear();
    return true;
  } catch (error) {
    console.error('Clear sessionStorage error:', error);
    return false;
  }
}

/**
 * Check if localStorage is available
 * @returns {boolean} Availability status
 */
export function isLocalStorageAvailable() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if sessionStorage is available
 * @returns {boolean} Availability status
 */
export function isSessionStorageAvailable() {
  try {
    const test = '__storage_test__';
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Save user session data
 * @param {Object} sessionData - User session data
 * @returns {boolean} Success status
 */
export function saveUserSession(sessionData) {
  return saveToLocal(STORAGE_KEYS.USER_SESSION, sessionData);
}

/**
 * Get user session data
 * @returns {Object|null} User session data
 */
export function getUserSession() {
  return getFromLocal(STORAGE_KEYS.USER_SESSION);
}

/**
 * Clear user session data
 * @returns {boolean} Success status
 */
export function clearUserSession() {
  return removeFromLocal(STORAGE_KEYS.USER_SESSION);
}

/**
 * Save user preferences
 * @param {Object} preferences - User preferences
 * @returns {boolean} Success status
 */
export function saveUserPreferences(preferences) {
  return saveToLocal(STORAGE_KEYS.USER_PREFERENCES, preferences);
}

/**
 * Get user preferences
 * @returns {Object|null} User preferences
 */
export function getUserPreferences() {
  return getFromLocal(STORAGE_KEYS.USER_PREFERENCES);
}

/**
 * Save theme preference
 * @param {string} theme - Theme name ('light' or 'dark')
 * @returns {boolean} Success status
 */
export function saveTheme(theme) {
  return saveToLocal(STORAGE_KEYS.THEME, theme);
}

/**
 * Get theme preference
 * @returns {string} Theme name (default: 'light')
 */
export function getTheme() {
  return getFromLocal(STORAGE_KEYS.THEME, 'light');
}

/**
 * Save cached data with expiration
 * @param {string} key - Cache key
 * @param {*} data - Data to cache
 * @param {number} expirationMinutes - Expiration time in minutes (default: 60)
 * @returns {boolean} Success status
 */
export function saveCachedData(key, data, expirationMinutes = 60) {
  const cacheEntry = {
    data: data,
    timestamp: Date.now(),
    expiration: Date.now() + (expirationMinutes * 60 * 1000)
  };
  
  const cacheKey = `${STORAGE_KEYS.CACHED_DATA}_${key}`;
  return saveToLocal(cacheKey, cacheEntry);
}

/**
 * Get cached data if not expired
 * @param {string} key - Cache key
 * @returns {*} Cached data or null if expired/not found
 */
export function getCachedData(key) {
  const cacheKey = `${STORAGE_KEYS.CACHED_DATA}_${key}`;
  const cacheEntry = getFromLocal(cacheKey);
  
  if (!cacheEntry) {
    return null;
  }
  
  // Check if expired
  if (Date.now() > cacheEntry.expiration) {
    removeFromLocal(cacheKey);
    return null;
  }
  
  return cacheEntry.data;
}

/**
 * Clear expired cache entries
 * @returns {number} Number of entries cleared
 */
export function clearExpiredCache() {
  let clearedCount = 0;
  const keys = Object.keys(localStorage);
  
  keys.forEach(key => {
    if (key.startsWith(STORAGE_KEYS.CACHED_DATA)) {
      const cacheEntry = getFromLocal(key);
      if (cacheEntry && Date.now() > cacheEntry.expiration) {
        removeFromLocal(key);
        clearedCount++;
      }
    }
  });
  
  return clearedCount;
}

/**
 * Save last sync timestamp
 * @param {string} syncType - Type of sync
 * @returns {boolean} Success status
 */
export function saveLastSync(syncType) {
  const syncData = getFromLocal(STORAGE_KEYS.LAST_SYNC, {});
  syncData[syncType] = Date.now();
  return saveToLocal(STORAGE_KEYS.LAST_SYNC, syncData);
}

/**
 * Get last sync timestamp
 * @param {string} syncType - Type of sync
 * @returns {number|null} Timestamp or null
 */
export function getLastSync(syncType) {
  const syncData = getFromLocal(STORAGE_KEYS.LAST_SYNC, {});
  return syncData[syncType] || null;
}

/**
 * Get storage size estimate
 * @returns {Object} Storage size information
 */
export function getStorageSize() {
  let localSize = 0;
  let sessionSize = 0;
  
  // Calculate localStorage size
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      localSize += localStorage[key].length + key.length;
    }
  }
  
  // Calculate sessionStorage size
  for (let key in sessionStorage) {
    if (sessionStorage.hasOwnProperty(key)) {
      sessionSize += sessionStorage[key].length + key.length;
    }
  }
  
  return {
    localStorage: {
      bytes: localSize,
      kb: (localSize / 1024).toFixed(2),
      mb: (localSize / (1024 * 1024)).toFixed(2)
    },
    sessionStorage: {
      bytes: sessionSize,
      kb: (sessionSize / 1024).toFixed(2),
      mb: (sessionSize / (1024 * 1024)).toFixed(2)
    },
    total: {
      bytes: localSize + sessionSize,
      kb: ((localSize + sessionSize) / 1024).toFixed(2),
      mb: ((localSize + sessionSize) / (1024 * 1024)).toFixed(2)
    }
  };
}

/**
 * Export all storage data (for backup)
 * @returns {Object} All storage data
 */
export function exportStorageData() {
  const data = {
    localStorage: {},
    sessionStorage: {},
    exportDate: new Date().toISOString()
  };
  
  // Export localStorage
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      try {
        data.localStorage[key] = JSON.parse(localStorage[key]);
      } catch {
        data.localStorage[key] = localStorage[key];
      }
    }
  }
  
  // Export sessionStorage
  for (let key in sessionStorage) {
    if (sessionStorage.hasOwnProperty(key)) {
      try {
        data.sessionStorage[key] = JSON.parse(sessionStorage[key]);
      } catch {
        data.sessionStorage[key] = sessionStorage[key];
      }
    }
  }
  
  return data;
}

/**
 * Import storage data (from backup)
 * @param {Object} data - Storage data to import
 * @param {boolean} clearExisting - Clear existing data before import
 * @returns {boolean} Success status
 */
export function importStorageData(data, clearExisting = false) {
  try {
    if (clearExisting) {
      clearLocal();
      clearSession();
    }
    
    // Import localStorage
    if (data.localStorage) {
      Object.entries(data.localStorage).forEach(([key, value]) => {
        saveToLocal(key, value);
      });
    }
    
    // Import sessionStorage
    if (data.sessionStorage) {
      Object.entries(data.sessionStorage).forEach(([key, value]) => {
        saveToSession(key, value);
      });
    }
    
    return true;
  } catch (error) {
    console.error('Import storage data error:', error);
    return false;
  }
}

console.log('Storage module loaded');
