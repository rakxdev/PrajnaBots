/**
 * ESP32 Control Module
 * Handles communication between web dashboard and ESP32 hardware
 */

import { database } from '../config/firebase-config.js';
import {
  ref,
  onValue,
  off,
  set,
  update,
  get
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

/**
 * Send control signal to ESP32
 * @param {string} deviceId - Device ID
 * @param {number} trigger - 1 to start, 0 to stop
 * @param {string} method - 'dry' or 'wet'
 * @param {number} pwm - PWM value (0-255)
 * @returns {Promise<Object>} Result object
 */
export async function sendCleaningCommand(deviceId, trigger, method, pwm) {
  try {
    const updates = {};
    
    // Set trigger signal
    updates[`devices/${deviceId}/cleaningControl/trigger`] = trigger;
    
    // Set method
    updates[`devices/${deviceId}/cleaningControl/method`] = method;
    
    // Set appropriate PWM
    if (method === 'dry') {
      updates[`devices/${deviceId}/cleaningControl/pwmDry`] = pwm;
    } else {
      updates[`devices/${deviceId}/cleaningControl/pwmWet`] = pwm;
    }
    
    // Update status
    updates[`devices/${deviceId}/cleaningControl/status`] = trigger === 1 ? 'cleaning' : 'idle';
    
    // Update timestamp
    updates[`devices/${deviceId}/cleaningControl/lastUpdated`] = Date.now();
    
    // If starting, initialize operation
    if (trigger === 1) {
      updates[`devices/${deviceId}/cleaningControl/currentOperation/startTime`] = Date.now();
      updates[`devices/${deviceId}/cleaningControl/currentOperation/progress`] = 0;
      updates[`devices/${deviceId}/cleaningControl/currentOperation/waterUsed`] = 0;
    }
    
    await update(ref(database), updates);
    
    console.log(`✅ ESP32 command sent: trigger=${trigger}, method=${method}, pwm=${pwm}`);
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error sending ESP32 command:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Listen to ESP32 status updates
 * @param {string} deviceId - Device ID
 * @param {Function} callback - Callback function receiving status data
 * @returns {Function} Unsubscribe function
 */
export function listenToESP32Status(deviceId, callback) {
  const statusRef = ref(database, `devices/${deviceId}/cleaningControl/status`);
  
  const unsubscribe = onValue(statusRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    }
  });
  
  return () => off(statusRef, unsubscribe);
}

/**
 * Update sensor data from ESP32
 * @param {string} deviceId - Device ID
 * @param {Object} sensorData - Sensor readings
 * @returns {Promise<Object>} Result object
 */
export async function updateSensorData(deviceId, sensorData) {
  try {
    const timestamp = Date.now();
    const updates = {};
    
    // Update environment data
    if (sensorData.environment) {
      updates[`devices/${deviceId}/environment`] = {
        ...sensorData.environment,
        timestamp
      };
    }
    
    // Update panel parameters
    if (sensorData.parameters) {
      // Calculate power if not provided
      const voltage = sensorData.parameters.voltage || 0;
      const current = sensorData.parameters.current || 0;
      const power = voltage * current;
      
      updates[`devices/${deviceId}/panelParameters`] = {
        voltage,
        current,
        power,
        timestamp
      };
    }
    
    // Update device info
    updates[`devices/${deviceId}/info/lastUpdated`] = timestamp;
    updates[`devices/${deviceId}/info/status`] = 'online';
    
    await update(ref(database), updates);
    
    console.log('✅ Sensor data updated from ESP32');
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error updating sensor data:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update cleaning progress from ESP32
 * @param {string} deviceId - Device ID
 * @param {number} progress - Progress percentage (0-100)
 * @param {number} waterUsed - Water used in liters
 * @returns {Promise<Object>} Result object
 */
export async function updateCleaningProgress(deviceId, progress, waterUsed = 0) {
  try {
    const updates = {};
    
    updates[`devices/${deviceId}/cleaningControl/currentOperation/progress`] = progress;
    updates[`devices/${deviceId}/cleaningControl/currentOperation/waterUsed`] = waterUsed;
    
    // If progress reaches 100%, mark as completed
    if (progress >= 100) {
      updates[`devices/${deviceId}/cleaningControl/status`] = 'completed';
      updates[`devices/${deviceId}/cleaningControl/trigger`] = 0;
      updates[`devices/${deviceId}/cleaningControl/autoSettings/lastCleaning`] = Date.now();
    }
    
    await update(ref(database), updates);
    
    console.log(`✅ Cleaning progress updated: ${progress}%`);
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error updating cleaning progress:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Report error from ESP32
 * @param {string} deviceId - Device ID
 * @param {string} errorMessage - Error message
 * @returns {Promise<Object>} Result object
 */
export async function reportError(deviceId, errorMessage) {
  try {
    const updates = {};
    
    updates[`devices/${deviceId}/cleaningControl/status`] = 'error';
    updates[`devices/${deviceId}/cleaningControl/trigger`] = 0;
    updates[`devices/${deviceId}/cleaningControl/lastError`] = {
      message: errorMessage,
      timestamp: Date.now()
    };
    
    await update(ref(database), updates);
    
    console.error(`❌ ESP32 error reported: ${errorMessage}`);
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error reporting ESP32 error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Set device online/offline status
 * @param {string} deviceId - Device ID
 * @param {boolean} isOnline - Online status
 * @returns {Promise<Object>} Result object
 */
export async function setDeviceStatus(deviceId, isOnline) {
  try {
    const updates = {};
    
    updates[`devices/${deviceId}/info/status`] = isOnline ? 'online' : 'offline';
    updates[`devices/${deviceId}/info/lastUpdated`] = Date.now();
    
    await update(ref(database), updates);
    
    console.log(`✅ Device status set to: ${isOnline ? 'online' : 'offline'}`);
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error setting device status:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if automatic cleaning should be triggered
 * @param {string} deviceId - Device ID
 * @returns {Promise<boolean>} True if cleaning should start
 */
export async function shouldTriggerAutoCleaning(deviceId) {
  try {
    const cleaningRef = ref(database, `devices/${deviceId}/cleaningControl/autoSettings`);
    const statusRef = ref(database, `devices/${deviceId}/panelStatus`);
    
    const [cleaningSnap, statusSnap] = await Promise.all([
      get(cleaningRef),
      get(statusRef)
    ]);
    
    if (!cleaningSnap.exists() || !statusSnap.exists()) {
      return false;
    }
    
    const autoSettings = cleaningSnap.val();
    const panelStatus = statusSnap.val();
    
    // Check if auto mode is enabled
    if (!autoSettings.enabled) {
      return false;
    }
    
    // Check dust threshold
    if (panelStatus.dustLevel >= autoSettings.dustThreshold) {
      console.log('🧹 Auto cleaning triggered: dust threshold exceeded');
      return true;
    }
    
    // Check schedule
    if (autoSettings.scheduleEnabled && autoSettings.lastCleaning) {
      const now = Date.now();
      const lastCleaning = autoSettings.lastCleaning;
      const daysSinceLastCleaning = (now - lastCleaning) / (1000 * 60 * 60 * 24);
      
      switch (autoSettings.schedule) {
        case 'daily':
          if (daysSinceLastCleaning >= 1) {
            console.log('🧹 Auto cleaning triggered: daily schedule');
            return true;
          }
          break;
        case 'weekly':
          if (daysSinceLastCleaning >= 7) {
            console.log('🧹 Auto cleaning triggered: weekly schedule');
            return true;
          }
          break;
        case 'monthly':
          if (daysSinceLastCleaning >= 30) {
            console.log('🧹 Auto cleaning triggered: monthly schedule');
            return true;
          }
          break;
      }
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ Error checking auto cleaning:', error);
    return false;
  }
}

/**
 * Select appropriate cleaning method based on conditions
 * @param {string} deviceId - Device ID
 * @returns {Promise<string>} Recommended method ('dry' or 'wet')
 */
export async function selectCleaningMethod(deviceId) {
  try {
    const statusRef = ref(database, `devices/${deviceId}/panelStatus`);
    const envRef = ref(database, `devices/${deviceId}/environment`);
    
    const [statusSnap, envSnap] = await Promise.all([
      get(statusRef),
      get(envRef)
    ]);
    
    if (!statusSnap.exists() || !envSnap.exists()) {
      return 'dry'; // Default to dry
    }
    
    const panelStatus = statusSnap.val();
    const environment = envSnap.val();
    
    // Decision logic
    // Light dust (0-100): Dry cleaning
    // Moderate to heavy dust (>100): Wet cleaning
    // High temperature (>45°C): Avoid wet cleaning (water evaporation)
    
    if (panelStatus.dustLevel > 100) {
      if (environment.temperature > 45) {
        console.log('⚠️ High temperature detected, using dry method despite heavy dust');
        return 'dry';
      }
      console.log('💧 Heavy dust detected, recommending wet cleaning');
      return 'wet';
    }
    
    console.log('🌬️ Light dust detected, recommending dry cleaning');
    return 'dry';
    
  } catch (error) {
    console.error('❌ Error selecting cleaning method:', error);
    return 'dry'; // Default to dry on error
  }
}
