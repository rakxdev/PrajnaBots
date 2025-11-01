/**
 * Database Initialization Module
 * Handles Firebase Realtime Database structure initialization
 * Based on Firebase SDK v10+ Modular API
 */

import { database } from '../config/firebase-config.js';
import { 
  ref, 
  set, 
  get, 
  update,
  push,
  child
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

/**
 * Initialize database structure for a new user
 * @param {string} userId - Firebase Auth UID
 * @param {string} userEmail - User email address
 * @param {string} displayName - User display name
 * @returns {Promise<Object>} Result object
 */
export async function initializeDatabaseForUser(userId, userEmail, displayName) {
  try {
    console.log('🔄 Initializing database for user:', userId);
    
    // Check if user already exists
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      console.log('✅ User database already initialized');
      return { success: true, message: 'Already initialized' };
    }
    
    // Create user profile
    await set(ref(database, `users/${userId}/profile`), {
      displayName: displayName || 'User',
      email: userEmail,
      createdAt: Date.now(),
      photoURL: null,
      lastLogin: Date.now()
    });
    
    console.log('✅ Database initialized for user:', userId);
    return { success: true, message: 'Database initialized successfully' };
    
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Add a new device to user's account
 * @param {string} userId - Firebase Auth UID
 * @param {Object} deviceInfo - Device information
 * @returns {Promise<Object>} Result with device ID
 */
export async function addDeviceToUser(userId, deviceInfo = {}) {
  try {
    console.log('🔄 Adding device for user:', userId);
    
    // Generate unique device ID
    const devicesRef = ref(database, 'devices');
    const newDeviceRef = push(child(devicesRef, 'temp'));
    const deviceId = newDeviceRef.key;
    
    console.log('📱 Generated device ID:', deviceId);
    
    // Add device reference to user
    await set(ref(database, `users/${userId}/devices/${deviceId}`), true);
    
    // Create complete device structure
    const deviceData = {
      info: {
        name: deviceInfo.name || 'Solar Panel Device',
        location: deviceInfo.location || 'Not specified',
        installDate: new Date().toISOString().split('T')[0],
        panelRating: deviceInfo.panelRating || 300,
        lat: deviceInfo.lat || 0,
        lon: deviceInfo.lon || 0,
        ownerId: userId,
        lastUpdated: Date.now(),
        status: 'online'
      },
      
      environment: {
        humidity: 0,
        temperature: 0,
        dustPresence: 0,
        timestamp: Date.now()
      },
      
      panelParameters: {
        voltage: 0,
        current: 0,
        power: 0,
        timestamp: Date.now()
      },
      
      panelStatus: {
        dustLevel: 0,
        dustCategory: 'light',
        currentEfficiency: 0,
        dailyLoss: {
          kwh: 0,
          percentage: 0,
          currency: 0
        },
        weeklyLoss: {
          kwh: 0,
          avgPercentage: 0
        },
        monthlyLoss: {
          kwh: 0,
          avgPercentage: 0
        },
        lastUpdated: Date.now()
      },
      
      cleaningControl: {
        mode: 'manual',
        method: 'dry',
        status: 'idle',
        pwmDry: 150,
        pwmWet: 180,
        trigger: 0,
        autoSettings: {
          enabled: false,
          dustThreshold: 100,
          scheduleEnabled: false,
          schedule: 'daily',
          lastCleaning: null,
          nextScheduled: null
        },
        currentOperation: {
          startTime: null,
          progress: 0,
          waterUsed: 0,
          estimatedCompletion: null
        },
        lastUpdated: Date.now()
      },
      
      historicalData: {
        daily: {}
      }
    };
    
    await set(ref(database, `devices/${deviceId}`), deviceData);
    
    console.log('✅ Device added successfully:', deviceId);
    return { 
      success: true, 
      deviceId,
      message: 'Device added successfully' 
    };
    
  } catch (error) {
    console.error('❌ Error adding device:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Initialize global configuration (run once)
 * @returns {Promise<Object>} Result object
 */
export async function initializeGlobalConfig() {
  try {
    console.log('🔄 Checking global configuration...');
    
    const configRef = ref(database, 'config');
    const snapshot = await get(configRef);
    
    if (!snapshot.exists()) {
      console.log('🔄 Initializing global configuration...');
      
      await set(configRef, {
        weatherAPI: {
          provider: 'openweathermap',
          apiKey: '',
          updateInterval: 1800000
        },
        ratesAndConstants: {
          electricityRate: 0.50,
          sunHoursAvg: 5.5,
          efficiencyFactor: 0.85
        }
      });
      
      console.log('✅ Global config initialized');
    } else {
      console.log('✅ Global config already exists');
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error initializing config:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all user devices
 * @param {string} userId - Firebase Auth UID
 * @returns {Promise<Array>} Array of device IDs
 */
export async function getUserDevices(userId) {
  try {
    const devicesRef = ref(database, `users/${userId}/devices`);
    const snapshot = await get(devicesRef);
    
    if (snapshot.exists()) {
      return Object.keys(snapshot.val());
    }
    
    return [];
    
  } catch (error) {
    console.error('❌ Error getting user devices:', error);
    return [];
  }
}

/**
 * Update device information
 * @param {string} deviceId - Device ID
 * @param {string} path - Path within device (e.g., 'info/name')
 * @param {any} value - Value to set
 * @returns {Promise<Object>} Result object
 */
export async function updateDeviceData(deviceId, path, value) {
  try {
    const fullPath = `devices/${deviceId}/${path}`;
    await set(ref(database, fullPath), value);
    
    console.log(`✅ Updated ${path} for device ${deviceId}`);
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error updating device data:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Batch update multiple device fields
 * @param {string} deviceId - Device ID
 * @param {Object} updates - Object with paths as keys and values
 * @returns {Promise<Object>} Result object
 */
export async function batchUpdateDevice(deviceId, updates) {
  try {
    const formattedUpdates = {};
    
    // Format updates with full paths
    Object.keys(updates).forEach(key => {
      formattedUpdates[`devices/${deviceId}/${key}`] = updates[key];
    });
    
    await update(ref(database), formattedUpdates);
    
    console.log(`✅ Batch updated device ${deviceId}`);
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error batch updating device:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Add daily historical data entry
 * @param {string} deviceId - Device ID
 * @param {string} date - Date string (YYYY-MM-DD)
 * @param {Object} data - Historical data for the day
 * @returns {Promise<Object>} Result object
 */
export async function addHistoricalData(deviceId, date, data) {
  try {
    const path = `devices/${deviceId}/historicalData/daily/${date}`;
    await set(ref(database, path), {
      ...data,
      timestamp: Date.now()
    });
    
    console.log(`✅ Added historical data for ${date}`);
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error adding historical data:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete device from user account
 * @param {string} userId - Firebase Auth UID
 * @param {string} deviceId - Device ID to delete
 * @returns {Promise<Object>} Result object
 */
export async function deleteDevice(userId, deviceId) {
  try {
    // Remove from user's device list
    await set(ref(database, `users/${userId}/devices/${deviceId}`), null);
    
    // Remove device data
    await set(ref(database, `devices/${deviceId}`), null);
    
    console.log(`✅ Deleted device ${deviceId}`);
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error deleting device:', error);
    return { success: false, error: error.message };
  }
}
