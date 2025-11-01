/**
 * URZA Solar Panel Dashboard - Main Controller
 * Real-time monitoring and control with Firebase
 */

import {
  getCurrentUser,
  getUserProfile,
  logoutUser,
  requireAuth,
  onAuthStateChange
} from '../core/auth.js';

import {
  initializeDatabaseForUser,
  addDeviceToUser,
  getUserDevices,
  updateDeviceData,
  batchUpdateDevice
} from '../core/database-init.js';

import { database } from '../config/firebase-config.js';
import {
  ref,
  onValue,
  off,
  set,
  update,
  get
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// DOM Elements
const loadingScreen = document.getElementById('loadingScreen');
const sidebar = document.getElementById('sidebar');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const welcomeText = document.getElementById('welcomeText');
const logoutBtn = document.getElementById('logoutBtn');

const deviceSelector = document.getElementById('deviceSelector');
const addDeviceBtn = document.getElementById('addDeviceBtn');
const noDeviceState = document.getElementById('noDeviceState');
const dashboardContent = document.getElementById('dashboardContent');

// Environment Status Elements
const humidityValue = document.getElementById('humidityValue');
const temperatureValue = document.getElementById('temperatureValue');
const dustPresenceValue = document.getElementById('dustPresenceValue');
const humidityBar = document.getElementById('humidityBar');
const temperatureBar = document.getElementById('temperatureBar');
const dustPresenceBar = document.getElementById('dustPresenceBar');

// Panel Parameters Elements
const voltageValue = document.getElementById('voltageValue');
const currentValue = document.getElementById('currentValue');
const powerValue = document.getElementById('powerValue');
const voltageGauge = document.getElementById('voltageGauge');
const currentGauge = document.getElementById('currentGauge');
const powerGauge = document.getElementById('powerGauge');

// Panel Status Elements
const dustLevelValue = document.getElementById('dustLevelValue');
const dustCategory = document.getElementById('dustCategory');
const dustOverlay = document.getElementById('dustOverlay');
const efficiencyText = document.getElementById('efficiencyText');
const efficiencyRing = document.getElementById('efficiencyRing');
const efficiencyBadge = document.getElementById('efficiencyBadge');
const expectedPower = document.getElementById('expectedPower');
const actualPower = document.getElementById('actualPower');
const lossKwh = document.getElementById('lossKwh');
const lossPercentage = document.getElementById('lossPercentage');
const lossCurrency = document.getElementById('lossCurrency');

// Cleaning Control Elements
const manualModeBtn = document.getElementById('manualModeBtn');
const autoModeBtn = document.getElementById('autoModeBtn');
const autoSettings = document.getElementById('autoSettings');
const dryMethodBtn = document.getElementById('dryMethodBtn');
const wetMethodBtn = document.getElementById('wetMethodBtn');
const pwmDrySlider = document.getElementById('pwmDrySlider');
const pwmWetSlider = document.getElementById('pwmWetSlider');
const pwmDryValue = document.getElementById('pwmDryValue');
const pwmWetValue = document.getElementById('pwmWetValue');
const pwmDryPercent = document.getElementById('pwmDryPercent');
const pwmWetPercent = document.getElementById('pwmWetPercent');
const startCleaningBtn = document.getElementById('startCleaningBtn');
const cleaningProgress = document.getElementById('cleaningProgress');
const cleaningStatus = document.getElementById('cleaningStatus');

// Modal Elements
const addDeviceModal = document.getElementById('addDeviceModal');
const closeAddDeviceModal = document.getElementById('closeAddDeviceModal');
const addDeviceForm = document.getElementById('addDeviceForm');

// State
let currentUser = null;
let selectedDeviceId = null;
let deviceListeners = {};
let currentMode = 'manual';
let currentMethod = 'dry';
let isCleaningActive = false;

/**
 * Initialize dashboard
 */
async function init() {
  console.log('🚀 Initializing URZA Dashboard...');
  
  // Require authentication
  const user = await requireAuth('../auth/login.html');
  
  if (user) {
    currentUser = user;
    await initializeDatabaseForUser(currentUser.uid, currentUser.email, currentUser.displayName || 'User');
    await loadUserProfile();
    await loadUserDevices();
    setupEventListeners();
    hideLoadingScreen();
  }
}

/**
 * Hide loading screen
 */
function hideLoadingScreen() {
  setTimeout(() => {
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 300);
  }, 500);
}

/**
 * Load user profile
 */
async function loadUserProfile() {
  try {
    const result = await getUserProfile(currentUser.uid);
    
    if (result.success) {
      const profile = result.data;
      const displayName = profile.displayName || currentUser.displayName || 'User';
      const email = profile.email || currentUser.email || '';
      
      userName.textContent = displayName;
      userEmail.textContent = email;
      welcomeText.textContent = `Welcome back, ${displayName.split(' ')[0]}!`;
      
      const initial = displayName.charAt(0).toUpperCase();
      userAvatar.textContent = initial;
      
      console.log('✅ User profile loaded');
    }
  } catch (error) {
    console.error('❌ Error loading profile:', error);
  }
}

/**
 * Load user devices
 */
async function loadUserDevices() {
  try {
    const deviceIds = await getUserDevices(currentUser.uid);
    
    console.log('📱 User devices:', deviceIds);
    
    // Clear existing options
    deviceSelector.innerHTML = '<option value="">Select Device...</option>';
    
    if (deviceIds.length === 0) {
      console.log('No devices found');
      showNoDeviceState();
      return;
    }
    
    // Load device names and populate selector
    for (const deviceId of deviceIds) {
      const deviceRef = ref(database, `devices/${deviceId}/info`);
      const snapshot = await get(deviceRef);
      
      if (snapshot.exists()) {
        const info = snapshot.val();
        const option = document.createElement('option');
        option.value = deviceId;
        option.textContent = info.name || deviceId;
        deviceSelector.appendChild(option);
      }
    }
    
    // Auto-select first device
    if (deviceIds.length > 0) {
      deviceSelector.value = deviceIds[0];
      selectDevice(deviceIds[0]);
    }
    
    console.log('✅ Devices loaded');
    
  } catch (error) {
    console.error('❌ Error loading devices:', error);
  }
}

/**
 * Show no device state
 */
function showNoDeviceState() {
  noDeviceState.style.display = 'block';
  dashboardContent.style.display = 'none';
}

/**
 * Hide no device state
 */
function hideNoDeviceState() {
  noDeviceState.style.display = 'none';
  dashboardContent.style.display = 'block';
}

/**
 * Select device
 */
function selectDevice(deviceId) {
  console.log('📱 Selecting device:', deviceId);
  
  // Clean up previous listeners
  cleanupDeviceListeners();
  
  selectedDeviceId = deviceId;
  hideNoDeviceState();
  
  // Set up real-time listeners
  setupDeviceListeners(deviceId);
}

/**
 * Setup real-time Firebase listeners for device
 */
function setupDeviceListeners(deviceId) {
  console.log('🔄 Setting up listeners for device:', deviceId);
  
  // Environment Status Listener
  const envRef = ref(database, `devices/${deviceId}/environment`);
  deviceListeners.environment = onValue(envRef, (snapshot) => {
    if (snapshot.exists()) {
      updateEnvironmentDisplay(snapshot.val());
    }
  });
  
  // Panel Parameters Listener
  const paramsRef = ref(database, `devices/${deviceId}/panelParameters`);
  deviceListeners.parameters = onValue(paramsRef, (snapshot) => {
    if (snapshot.exists()) {
      updateParametersDisplay(snapshot.val());
    }
  });
  
  // Panel Status Listener
  const statusRef = ref(database, `devices/${deviceId}/panelStatus`);
  deviceListeners.status = onValue(statusRef, (snapshot) => {
    if (snapshot.exists()) {
      updateStatusDisplay(snapshot.val());
    }
  });
  
  // Cleaning Control Listener
  const cleaningRef = ref(database, `devices/${deviceId}/cleaningControl`);
  deviceListeners.cleaning = onValue(cleaningRef, (snapshot) => {
    if (snapshot.exists()) {
      updateCleaningDisplay(snapshot.val());
    }
  });
  
  console.log('✅ Listeners set up');
}

/**
 * Cleanup device listeners
 */
function cleanupDeviceListeners() {
  Object.keys(deviceListeners).forEach(key => {
    if (deviceListeners[key]) {
      off(deviceListeners[key]);
    }
  });
  deviceListeners = {};
}

/**
 * Update Environment Display
 */
function updateEnvironmentDisplay(data) {
  const { humidity, temperature, dustPresence } = data;
  
  // Update values
  humidityValue.textContent = humidity.toFixed(1);
  temperatureValue.textContent = temperature.toFixed(1);
  dustPresenceValue.textContent = dustPresence.toFixed(1);
  
  // Update bars
  humidityBar.style.width = `${Math.min(humidity, 100)}%`;
  const tempPercent = Math.min(((temperature + 10) / 70) * 100, 100);
  temperatureBar.style.width = `${tempPercent}%`;
  const dustPercent = Math.min((dustPresence / 500) * 100, 100);
  dustPresenceBar.style.width = `${dustPercent}%`;
  
  console.log('📊 Environment updated:', data);
}

/**
 * Update Parameters Display
 */
function updateParametersDisplay(data) {
  const { voltage, current, power } = data;
  
  // Update values
  voltageValue.textContent = voltage.toFixed(2);
  currentValue.textContent = current.toFixed(2);
  powerValue.textContent = power.toFixed(2);
  
  // Update gauges (0-180 degrees = half circle)
  updateGauge(voltageGauge, voltage, 50); // 0-50V range
  updateGauge(currentGauge, current, 20); // 0-20A range
  updateGauge(powerGauge, power, 1000); // 0-1000W range
  
  console.log('⚡ Parameters updated:', data);
}

/**
 * Update gauge visual
 */
function updateGauge(element, value, maxValue) {
  const percent = Math.min((value / maxValue) * 100, 100);
  const circumference = 2 * Math.PI * 80; // radius = 80
  const dashOffset = circumference * (1 - (percent / 100) * 0.5); // Half circle
  
  element.style.strokeDasharray = `${circumference}`;
  element.style.strokeDashoffset = `${dashOffset}`;
}

/**
 * Update Status Display
 */
function updateStatusDisplay(data) {
  const { dustLevel, dustCategory: category, currentEfficiency, dailyLoss } = data;
  
  // Update dust level
  dustLevelValue.textContent = dustLevel.toFixed(1);
  dustCategory.textContent = category.charAt(0).toUpperCase() + category.slice(1);
  dustCategory.className = `dust-category-badge ${category}`;
  
  // Update dust overlay opacity based on level
  const dustOpacity = Math.min(dustLevel / 300, 1);
  dustOverlay.style.opacity = dustOpacity;
  
  // Update efficiency
  efficiencyText.textContent = `${currentEfficiency.toFixed(1)}%`;
  updateEfficiencyRing(currentEfficiency);
  updateEfficiencyBadge(currentEfficiency);
  
  // Update expected/actual power
  const expected = 300; // TODO: Get from device info
  actualPower.textContent = `${(expected * currentEfficiency / 100).toFixed(1)} W`;
  expectedPower.textContent = `${expected} W`;
  
  // Update loss
  if (dailyLoss) {
    lossKwh.textContent = dailyLoss.kwh.toFixed(1);
    lossPercentage.textContent = `${dailyLoss.percentage.toFixed(1)}%`;
    lossCurrency.textContent = `$${dailyLoss.currency.toFixed(2)}`;
  }
  
  console.log('📈 Status updated:', data);
}

/**
 * Update efficiency ring
 */
function updateEfficiencyRing(efficiency) {
  const circumference = 2 * Math.PI * 80;
  const dashOffset = circumference * (1 - efficiency / 100);
  
  efficiencyRing.style.strokeDasharray = `${circumference}`;
  efficiencyRing.style.strokeDashoffset = `${dashOffset}`;
  
  // Update color based on efficiency
  if (efficiency >= 90) {
    efficiencyRing.style.stroke = '#10b981';
  } else if (efficiency >= 75) {
    efficiencyRing.style.stroke = '#3b82f6';
  } else if (efficiency >= 60) {
    efficiencyRing.style.stroke = '#f59e0b';
  } else {
    efficiencyRing.style.stroke = '#ef4444';
  }
}

/**
 * Update efficiency badge
 */
function updateEfficiencyBadge(efficiency) {
  if (efficiency >= 90) {
    efficiencyBadge.textContent = 'Excellent';
    efficiencyBadge.style.background = '#d1fae5';
    efficiencyBadge.style.color = '#065f46';
  } else if (efficiency >= 75) {
    efficiencyBadge.textContent = 'Good';
    efficiencyBadge.style.background = '#dbeafe';
    efficiencyBadge.style.color = '#1e40af';
  } else if (efficiency >= 60) {
    efficiencyBadge.textContent = 'Fair';
    efficiencyBadge.style.background = '#fef3c7';
    efficiencyBadge.style.color = '#92400e';
  } else {
    efficiencyBadge.textContent = 'Poor';
    efficiencyBadge.style.background = '#fee2e2';
    efficiencyBadge.style.color = '#991b1b';
  }
}

/**
 * Update Cleaning Display
 */
function updateCleaningDisplay(data) {
  const { mode, method, status, pwmDry, pwmWet, currentOperation } = data;
  
  // Update mode buttons
  currentMode = mode;
  updateModeButtons(mode);
  
  // Update method buttons
  currentMethod = method;
  updateMethodButtons(method);
  
  // Update PWM sliders
  pwmDrySlider.value = pwmDry;
  pwmWetSlider.value = pwmWet;
  pwmDryValue.textContent = pwmDry;
  pwmWetValue.textContent = pwmWet;
  pwmDryPercent.textContent = `${Math.round((pwmDry / 255) * 100)}%`;
  pwmWetPercent.textContent = `${Math.round((pwmWet / 255) * 100)}%`;
  
  // Update status badge
  cleaningStatus.textContent = status.charAt(0).toUpperCase() + status.slice(1);
  updateStatusBadge(status);
  
  // Update cleaning progress
  if (status === 'cleaning') {
    showCleaningProgress(currentOperation);
  } else {
    hideCleaningProgress();
  }
  
  console.log('🧹 Cleaning updated:', data);
}

/**
 * Update mode buttons
 */
function updateModeButtons(mode) {
  if (mode === 'manual') {
    manualModeBtn.classList.add('active');
    autoModeBtn.classList.remove('active');
    autoSettings.style.display = 'none';
  } else {
    manualModeBtn.classList.remove('active');
    autoModeBtn.classList.add('active');
    autoSettings.style.display = 'block';
  }
}

/**
 * Update method buttons
 */
function updateMethodButtons(method) {
  if (method === 'dry') {
    dryMethodBtn.classList.add('active');
    wetMethodBtn.classList.remove('active');
  } else {
    dryMethodBtn.classList.remove('active');
    wetMethodBtn.classList.add('active');
  }
}

/**
 * Update status badge
 */
function updateStatusBadge(status) {
  switch (status) {
    case 'idle':
      cleaningStatus.style.background = '#e2e8f0';
      cleaningStatus.style.color = '#475569';
      break;
    case 'scanning':
      cleaningStatus.style.background = '#dbeafe';
      cleaningStatus.style.color = '#1e40af';
      break;
    case 'cleaning':
      cleaningStatus.style.background = '#06b6d4';
      cleaningStatus.style.color = '#ffffff';
      break;
    case 'completed':
      cleaningStatus.style.background = '#d1fae5';
      cleaningStatus.style.color = '#065f46';
      break;
    case 'error':
      cleaningStatus.style.background = '#fee2e2';
      cleaningStatus.style.color = '#991b1b';
      break;
  }
}

/**
 * Show cleaning progress
 */
function showCleaningProgress(operation) {
  startCleaningBtn.style.display = 'none';
  cleaningProgress.style.display = 'block';
  isCleaningActive = true;
  
  if (operation) {
    const progress = operation.progress || 0;
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');
    const waterUsed = document.getElementById('waterUsed');
    const elapsedTime = document.getElementById('elapsedTime');
    
    progressFill.style.width = `${progress}%`;
    progressPercent.textContent = `${progress}%`;
    
    if (operation.waterUsed) {
      waterUsed.textContent = operation.waterUsed.toFixed(1);
    }
    
    if (operation.startTime) {
      const elapsed = Math.floor((Date.now() - operation.startTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      elapsedTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }
}

/**
 * Hide cleaning progress
 */
function hideCleaningProgress() {
  startCleaningBtn.style.display = 'flex';
  cleaningProgress.style.display = 'none';
  isCleaningActive = false;
}

/**
 * Start cleaning operation
 */
async function startCleaning() {
  if (!selectedDeviceId) return;
  
  console.log('🧹 Starting cleaning...');
  
  try {
    const updates = {
      'cleaningControl/trigger': 1,
      'cleaningControl/status': 'cleaning',
      'cleaningControl/currentOperation/startTime': Date.now(),
      'cleaningControl/currentOperation/progress': 0,
      'cleaningControl/currentOperation/waterUsed': 0
    };
    
    await batchUpdateDevice(selectedDeviceId, updates);
    
    console.log('✅ Cleaning started');
    
  } catch (error) {
    console.error('❌ Error starting cleaning:', error);
    alert('Failed to start cleaning. Please try again.');
  }
}

/**
 * Stop cleaning operation
 */
async function stopCleaning() {
  if (!selectedDeviceId) return;
  
  console.log('⏹️ Stopping cleaning...');
  
  try {
    const updates = {
      'cleaningControl/trigger': 0,
      'cleaningControl/status': 'idle'
    };
    
    await batchUpdateDevice(selectedDeviceId, updates);
    
    console.log('✅ Cleaning stopped');
    
  } catch (error) {
    console.error('❌ Error stopping cleaning:', error);
  }
}

/**
 * Update cleaning mode
 */
async function updateCleaningMode(mode) {
  if (!selectedDeviceId) return;
  
  currentMode = mode;
  updateModeButtons(mode);
  
  try {
    await updateDeviceData(selectedDeviceId, 'cleaningControl/mode', mode);
    console.log(`✅ Mode updated to: ${mode}`);
  } catch (error) {
    console.error('❌ Error updating mode:', error);
  }
}

/**
 * Update cleaning method
 */
async function updateCleaningMethod(method) {
  if (!selectedDeviceId) return;
  
  currentMethod = method;
  updateMethodButtons(method);
  
  try {
    await updateDeviceData(selectedDeviceId, 'cleaningControl/method', method);
    console.log(`✅ Method updated to: ${method}`);
  } catch (error) {
    console.error('❌ Error updating method:', error);
  }
}

/**
 * Update PWM value
 */
async function updatePWM(type, value) {
  if (!selectedDeviceId) return;
  
  try {
    await updateDeviceData(selectedDeviceId, `cleaningControl/pwm${type.charAt(0).toUpperCase() + type.slice(1)}`, parseInt(value));
    console.log(`✅ PWM ${type} updated to: ${value}`);
  } catch (error) {
    console.error(`❌ Error updating PWM ${type}:`, error);
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Mobile menu toggle
  mobileMenuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });
  
  // Logout
  logoutBtn.addEventListener('click', async () => {
    await logoutUser();
    window.location.href = '../auth/login.html';
  });
  
  // Device selector
  deviceSelector.addEventListener('change', (e) => {
    const deviceId = e.target.value;
    if (deviceId) {
      selectDevice(deviceId);
    } else {
      showNoDeviceState();
    }
  });
  
  // Add device button
  addDeviceBtn.addEventListener('click', () => {
    addDeviceModal.style.display = 'flex';
  });
  
  // Close modal
  closeAddDeviceModal.addEventListener('click', () => {
    addDeviceModal.style.display = 'none';
  });
  
  // Add device form
  addDeviceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const deviceInfo = {
      name: document.getElementById('deviceName').value,
      location: document.getElementById('deviceLocation').value,
      panelRating: parseInt(document.getElementById('deviceRating').value),
      lat: parseFloat(document.getElementById('deviceLat').value),
      lon: parseFloat(document.getElementById('deviceLon').value)
    };
    
    console.log('Adding device:', deviceInfo);
    
    const result = await addDeviceToUser(currentUser.uid, deviceInfo);
    
    if (result.success) {
      alert('Device added successfully!');
      addDeviceModal.style.display = 'none';
      addDeviceForm.reset();
      await loadUserDevices();
    } else {
      alert('Failed to add device: ' + result.error);
    }
  });
  
  // Cleaning mode buttons
  manualModeBtn.addEventListener('click', () => updateCleaningMode('manual'));
  autoModeBtn.addEventListener('click', () => updateCleaningMode('automatic'));
  
  // Cleaning method buttons
  dryMethodBtn.addEventListener('click', () => updateCleaningMethod('dry'));
  wetMethodBtn.addEventListener('click', () => updateCleaningMethod('wet'));
  
  // PWM sliders
  pwmDrySlider.addEventListener('input', (e) => {
    pwmDryValue.textContent = e.target.value;
    pwmDryPercent.textContent = `${Math.round((e.target.value / 255) * 100)}%`;
  });
  
  pwmDrySlider.addEventListener('change', (e) => {
    updatePWM('dry', e.target.value);
  });
  
  pwmWetSlider.addEventListener('input', (e) => {
    pwmWetValue.textContent = e.target.value;
    pwmWetPercent.textContent = `${Math.round((e.target.value / 255) * 100)}%`;
  });
  
  pwmWetSlider.addEventListener('change', (e) => {
    updatePWM('wet', e.target.value);
  });
  
  // Start/Stop cleaning buttons
  startCleaningBtn.addEventListener('click', startCleaning);
  
  const stopCleaningBtn = document.getElementById('stopCleaningBtn');
  if (stopCleaningBtn) {
    stopCleaningBtn.addEventListener('click', stopCleaning);
  }
  
  console.log('✅ Event listeners set up');
}

// Initialize on page load
init();
