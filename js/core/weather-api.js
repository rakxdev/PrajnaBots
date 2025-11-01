/**
 * Weather API Integration Module
 * Fetches dust/air quality data from external weather APIs
 */

import { database } from '../config/firebase-config.js';
import { ref, get, update } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

/**
 * Get weather API configuration from Firebase
 * @returns {Promise<Object>} API configuration
 */
async function getWeatherConfig() {
  try {
    const configRef = ref(database, 'config/weatherAPI');
    const snapshot = await get(configRef);
    
    if (snapshot.exists()) {
      return snapshot.val();
    }
    
    console.warn('⚠️ No weather API config found, using defaults');
    return {
      provider: 'openweathermap',
      apiKey: '',
      updateInterval: 1800000 // 30 minutes
    };
    
  } catch (error) {
    console.error('❌ Error getting weather config:', error);
    return null;
  }
}

/**
 * Fetch dust level data from OpenWeatherMap Air Pollution API
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} apiKey - API key
 * @returns {Promise<Object>} Dust level data
 */
async function fetchOpenWeatherMapData(lat, lon, apiKey) {
  if (!apiKey) {
    console.warn('⚠️ No API key provided for OpenWeatherMap');
    return null;
  }
  
  try {
    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.list || data.list.length === 0) {
      throw new Error('No air pollution data available');
    }
    
    const components = data.list[0].components;
    
    // PM2.5 and PM10 are the main dust indicators
    const pm25 = components.pm2_5 || 0;
    const pm10 = components.pm10 || 0;
    
    // Calculate average dust level
    const dustLevel = (pm25 + pm10) / 2;
    
    // Categorize dust level
    let category = 'light';
    if (dustLevel > 150) {
      category = 'high';
    } else if (dustLevel > 50) {
      category = 'moderate';
    }
    
    console.log(`✅ OpenWeatherMap data fetched: PM2.5=${pm25}, PM10=${pm10}, Dust=${dustLevel.toFixed(1)}`);
    
    return {
      dustLevel: dustLevel,
      dustCategory: category,
      pm25: pm25,
      pm10: pm10,
      aqi: data.list[0].main.aqi,
      timestamp: Date.now()
    };
    
  } catch (error) {
    console.error('❌ Error fetching OpenWeatherMap data:', error);
    return null;
  }
}

/**
 * Fetch dust level data from WeatherAPI.com
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} apiKey - API key
 * @returns {Promise<Object>} Dust level data
 */
async function fetchWeatherAPIData(lat, lon, apiKey) {
  if (!apiKey) {
    console.warn('⚠️ No API key provided for WeatherAPI.com');
    return null;
  }
  
  try {
    const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}&aqi=yes`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.current || !data.current.air_quality) {
      throw new Error('No air quality data available');
    }
    
    const airQuality = data.current.air_quality;
    
    // Get PM2.5 and PM10
    const pm25 = airQuality.pm2_5 || 0;
    const pm10 = airQuality.pm10 || 0;
    
    // Calculate average dust level
    const dustLevel = (pm25 + pm10) / 2;
    
    // Categorize dust level
    let category = 'light';
    if (dustLevel > 150) {
      category = 'high';
    } else if (dustLevel > 50) {
      category = 'moderate';
    }
    
    console.log(`✅ WeatherAPI data fetched: PM2.5=${pm25}, PM10=${pm10}, Dust=${dustLevel.toFixed(1)}`);
    
    return {
      dustLevel: dustLevel,
      dustCategory: category,
      pm25: pm25,
      pm10: pm10,
      aqi: airQuality['us-epa-index'],
      timestamp: Date.now()
    };
    
  } catch (error) {
    console.error('❌ Error fetching WeatherAPI data:', error);
    return null;
  }
}

/**
 * Update dust level for a device
 * @param {string} deviceId - Device ID
 * @returns {Promise<Object>} Result object
 */
export async function updateDustLevel(deviceId) {
  try {
    // Get device location
    const deviceRef = ref(database, `devices/${deviceId}/info`);
    const deviceSnapshot = await get(deviceRef);
    
    if (!deviceSnapshot.exists()) {
      throw new Error('Device not found');
    }
    
    const deviceInfo = deviceSnapshot.val();
    const { lat, lon } = deviceInfo;
    
    if (!lat || !lon) {
      throw new Error('Device location not set');
    }
    
    // Get weather API config
    const config = await getWeatherConfig();
    
    if (!config) {
      throw new Error('Weather API config not available');
    }
    
    // Fetch dust data based on provider
    let dustData = null;
    
    switch (config.provider) {
      case 'openweathermap':
        dustData = await fetchOpenWeatherMapData(lat, lon, config.apiKey);
        break;
      case 'weatherapi':
        dustData = await fetchWeatherAPIData(lat, lon, config.apiKey);
        break;
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }
    
    if (!dustData) {
      throw new Error('Failed to fetch dust data');
    }
    
    // Update device panel status
    const updates = {};
    updates[`devices/${deviceId}/panelStatus/dustLevel`] = dustData.dustLevel;
    updates[`devices/${deviceId}/panelStatus/dustCategory`] = dustData.dustCategory;
    updates[`devices/${deviceId}/panelStatus/lastUpdated`] = Date.now();
    
    await update(ref(database), updates);
    
    console.log(`✅ Dust level updated for device ${deviceId}: ${dustData.dustLevel.toFixed(1)} gm/m²`);
    
    return {
      success: true,
      dustData
    };
    
  } catch (error) {
    console.error('❌ Error updating dust level:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Start periodic dust level updates for a device
 * @param {string} deviceId - Device ID
 * @param {number} interval - Update interval in milliseconds (default: 30 minutes)
 * @returns {Function} Function to stop updates
 */
export function startDustLevelUpdates(deviceId, interval = 1800000) {
  console.log(`🔄 Starting dust level updates for device ${deviceId} (interval: ${interval}ms)`);
  
  // Initial update
  updateDustLevel(deviceId);
  
  // Set up periodic updates
  const intervalId = setInterval(() => {
    updateDustLevel(deviceId);
  }, interval);
  
  // Return function to stop updates
  return () => {
    clearInterval(intervalId);
    console.log(`⏹️ Stopped dust level updates for device ${deviceId}`);
  };
}

/**
 * Get current weather conditions for a location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} Weather data
 */
export async function getWeatherConditions(lat, lon) {
  try {
    const config = await getWeatherConfig();
    
    if (!config || !config.apiKey) {
      throw new Error('Weather API not configured');
    }
    
    // Using OpenWeatherMap current weather API
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${config.apiKey}&units=metric`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Weather API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      temperature: data.main.temp,
      humidity: data.main.humidity,
      description: data.weather[0].description,
      windSpeed: data.wind.speed,
      cloudiness: data.clouds.all,
      timestamp: Date.now()
    };
    
  } catch (error) {
    console.error('❌ Error getting weather conditions:', error);
    return null;
  }
}

/**
 * Check if weather conditions are suitable for cleaning
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<boolean>} True if conditions are suitable
 */
export async function isSuitableForCleaning(lat, lon) {
  try {
    const weather = await getWeatherConditions(lat, lon);
    
    if (!weather) {
      return true; // Default to allowing cleaning if we can't get weather
    }
    
    // Don't clean if:
    // - Raining (description contains 'rain')
    // - Very windy (>15 m/s)
    // - Extremely hot (>50°C)
    
    if (weather.description.toLowerCase().includes('rain')) {
      console.log('⚠️ Rain detected, not suitable for cleaning');
      return false;
    }
    
    if (weather.windSpeed > 15) {
      console.log('⚠️ High wind detected, not suitable for cleaning');
      return false;
    }
    
    if (weather.temperature > 50) {
      console.log('⚠️ Extreme heat detected, not suitable for cleaning');
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error checking weather suitability:', error);
    return true; // Default to allowing cleaning
  }
}
