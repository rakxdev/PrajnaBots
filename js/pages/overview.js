/**
 * Dashboard Overview Page
 * Main dashboard with device management
 */

import {
  getCurrentUser,
  getUserProfile,
  logoutUser,
  requireAuth,
  onAuthStateChange
} from '../core/auth.js';

import {
  getData,
  setData,
  updateData,
  deleteData,
  pushData,
  listenToData
} from '../core/database.js';

import {
  saveToLocal,
  getFromLocal,
  STORAGE_KEYS
} from '../core/storage.js';

// DOM Elements
const sidebar = document.getElementById('sidebar');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const welcomeText = document.getElementById('welcomeText');
const logoutBtn = document.getElementById('logoutBtn');
const addDeviceBtn = document.getElementById('addDeviceBtn');
const statsGrid = document.getElementById('statsGrid');
const devicesContainer = document.getElementById('devicesContainer');

// State
let currentUser = null;
let devices = [];
let devicesListener = null;

/**
 * Initialize page - require authentication
 */
async function initAuth() {
  const user = await requireAuth('../auth/login.html');
  
  if (user) {
    currentUser = user;
    loadUserProfile();
    loadDashboardData();
  }
}

/**
 * Load user profile
 */
async function loadUserProfile() {
  try {
    const result = await getUserProfile(currentUser.uid);
    
    if (result.success) {
      const profile = result.data;
      
      // Update UI with user data
      const displayName = profile.displayName || currentUser.displayName || 'User';
      const email = profile.email || currentUser.email || '';
      
      userName.textContent = displayName;
      userEmail.textContent = email;
      welcomeText.textContent = `Welcome back, ${displayName.split(' ')[0]}!`;
      
      // Set avatar initial
      const initial = displayName.charAt(0).toUpperCase();
      userAvatar.textContent = initial;
      
      console.log('User profile loaded:', profile);
    }
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

/**
 * Load dashboard data
 */
async function loadDashboardData() {
  loadStats();
  loadDevices();
}

/**
 * Load statistics
 */
async function loadStats() {
  const totalDevices = devices.length;
  const cleanDevices = devices.filter(d => d.status === 'clean').length;
  const avgEfficiency = totalDevices > 0 
    ? Math.round(devices.reduce((sum, d) => sum + (d.efficiency || 0), 0) / totalDevices) 
    : 0;
  const avgDustLevel = totalDevices > 0
    ? Math.round(devices.reduce((sum, d) => sum + (d.dustLevel || 0), 0) / totalDevices)
    : 0;
  const autoModeDevices = devices.filter(d => d.cleaningMode === 'auto').length;
  const manualModeDevices = devices.filter(d => d.cleaningMode === 'manual').length;
  const highDustDevices = devices.filter(d => (d.dustLevel || 0) > 50).length;
  
  // Calculate stats from devices
  const stats = [
    {
      label: 'Total Panels',
      value: totalDevices,
      change: `${autoModeDevices} auto, ${manualModeDevices} manual`,
      positive: true,
      icon: '📱',
      color: '#3b82f6'
    },
    {
      label: 'Avg Efficiency',
      value: `${avgEfficiency}%`,
      change: avgEfficiency > 90 ? 'Excellent' : avgEfficiency > 70 ? 'Good' : 'Needs attention',
      positive: avgEfficiency > 90,
      icon: '⚡',
      color: '#10b981'
    },
    {
      label: 'Avg Dust Level',
      value: `${avgDustLevel}%`,
      change: avgDustLevel < 20 ? 'Clean' : avgDustLevel < 50 ? 'Moderate' : 'High',
      positive: avgDustLevel < 20,
      icon: '🧹',
      color: avgDustLevel < 20 ? '#10b981' : avgDustLevel < 50 ? '#f59e0b' : '#ef4444'
    },
    {
      label: 'Alerts',
      value: highDustDevices,
      change: highDustDevices > 0 ? `${highDustDevices} need cleaning` : 'All panels clean',
      positive: highDustDevices === 0,
      icon: '🔔',
      color: '#ef4444'
    }
  ];

  statsGrid.innerHTML = stats.map(stat => `
    <div class="stat-card">
      <div class="stat-header">
        <span class="stat-label">${stat.label}</span>
        <div class="stat-icon" style="background: ${stat.color}20; color: ${stat.color};">
          <span style="font-size: 20px;">${stat.icon}</span>
        </div>
      </div>
      <div class="stat-value">${stat.value}</div>
      <div class="stat-change ${stat.positive ? 'positive' : 'negative'}">
        ${stat.change}
      </div>
    </div>
  `).join('');
}

/**
 * Load devices
 */
async function loadDevices() {
  try {
    const path = `users/${currentUser.uid}/devices`;
    
    // Listen to real-time updates
    if (devicesListener) {
      devicesListener(); // Unsubscribe previous listener
    }
    
    devicesListener = listenToData(path, (result) => {
      if (result.success && result.data) {
        // Convert object to array
        devices = Object.entries(result.data).map(([id, device]) => ({
          id,
          ...device
        }));
        
        renderDevices();
        loadStats(); // Update stats when devices change
      } else {
        devices = [];
        renderEmptyState();
      }
    });
    
  } catch (error) {
    console.error('Error loading devices:', error);
    renderEmptyState();
  }
}

/**
 * Render devices grid
 */
function renderDevices() {
  if (devices.length === 0) {
    renderEmptyState();
    return;
  }

  const devicesHTML = devices.map(device => {
    const dustLevel = device.dustLevel || 0;
    const dustStatus = dustLevel < 20 ? 'clean' : dustLevel < 50 ? 'moderate' : 'dirty';
    const dustColor = dustLevel < 20 ? '#10b981' : dustLevel < 50 ? '#f59e0b' : '#ef4444';
    
    return `
    <div class="device-card" data-device-id="${device.id}">
      <div class="device-header">
        <h3 class="device-name">${device.name || 'Unnamed Device'}</h3>
        <span class="device-status ${device.status || 'offline'}">${(device.status || 'offline').toUpperCase()}</span>
      </div>
      
      <div class="device-metrics">
        <div class="metric-row">
          <span class="metric-icon">⚡</span>
          <div class="metric-content">
            <span class="metric-label">Efficiency</span>
            <span class="metric-value">${device.efficiency || 0}%</span>
          </div>
        </div>
        
        <div class="metric-row">
          <span class="metric-icon">🧹</span>
          <div class="metric-content">
            <span class="metric-label">Dust Level</span>
            <span class="metric-value" style="color: ${dustColor};">${dustLevel}%</span>
          </div>
        </div>
        
        <div class="metric-row">
          <span class="metric-icon">🌡️</span>
          <div class="metric-content">
            <span class="metric-label">Temperature</span>
            <span class="metric-value">${device.temperature || 0}°C</span>
          </div>
        </div>
        
        <div class="metric-row">
          <span class="metric-icon">🔋</span>
          <div class="metric-content">
            <span class="metric-label">Voltage / Current</span>
            <span class="metric-value">${device.voltage || 0}V / ${device.current || 0}A</span>
          </div>
        </div>
        
        <div class="metric-row">
          <span class="metric-icon">🔧</span>
          <div class="metric-content">
            <span class="metric-label">Cleaning Mode</span>
            <span class="metric-value">${device.cleaningMode === 'auto' ? 'Auto' : 'Manual'}</span>
          </div>
        </div>
        
        <div class="metric-row">
          <span class="metric-icon">📍</span>
          <div class="metric-content">
            <span class="metric-label">Location</span>
            <span class="metric-value">${device.location || 'Not set'}</span>
          </div>
        </div>
        
        <div class="metric-row">
          <span class="metric-icon">🕒</span>
          <div class="metric-content">
            <span class="metric-label">Last Cleaned</span>
            <span class="metric-value">${device.lastCleaned ? formatDate(device.lastCleaned) : 'Never'}</span>
          </div>
        </div>
      </div>
      
      <div class="device-actions">
        <button class="device-action-btn primary" onclick="window.startCleaning('${device.id}')">
          🧹 Clean Now
        </button>
        <button class="device-action-btn" onclick="window.viewDevice('${device.id}')">
          📊 Details
        </button>
        <button class="device-action-btn" onclick="window.toggleCleaningMode('${device.id}')">
          ${device.cleaningMode === 'auto' ? '🔧 Manual' : '🤖 Auto'}
        </button>
      </div>
    </div>
  `}).join('');

  devicesContainer.innerHTML = `<div class="devices-grid">${devicesHTML}</div>`;
}

/**
 * Render empty state
 */
function renderEmptyState() {
  devicesContainer.innerHTML = `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="4" y="4" width="16" height="16" rx="2"></rect>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
      <h3>No devices yet</h3>
      <p>Add your first solar panel device to start monitoring</p>
      <button class="btn-add-device" onclick="window.showAddDeviceModal()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Add Your First Device
      </button>
    </div>
  `;
}

/**
 * Add device modal/prompt
 */
window.showAddDeviceModal = async function() {
  const deviceName = prompt('Enter device name:', 'Solar Panel 1');
  if (!deviceName) return;
  
  const location = prompt('Enter location:', 'Rooftop');
  if (!location) return;
  
  const newDevice = {
    name: deviceName,
    location: location,
    status: 'clean',
    efficiency: Math.floor(Math.random() * 10) + 90,
    dustLevel: Math.floor(Math.random() * 20),
    temperature: Math.floor(Math.random() * 15) + 35,
    voltage: (Math.random() * 5 + 45).toFixed(2),
    current: (Math.random() * 2 + 8).toFixed(2),
    cleaningMode: 'manual',
    lastCleaned: Date.now(),
    createdAt: Date.now()
  };
  
  try {
    const path = `users/${currentUser.uid}/devices`;
    const result = await pushData(path, newDevice);
    
    if (result.success) {
      console.log('Device added:', result.key);
      // Devices will auto-update via listener
    }
  } catch (error) {
    console.error('Error adding device:', error);
    alert('Failed to add device. Please try again.');
  }
};

/**
 * View device details
 */
window.viewDevice = function(deviceId) {
  console.log('View device:', deviceId);
  window.location.href = `device-details.html?id=${deviceId}`;
};

/**
 * Edit device
 */
window.editDevice = async function(deviceId) {
  const device = devices.find(d => d.id === deviceId);
  if (!device) return;
  
  const newName = prompt('Enter new name:', device.name);
  if (!newName) return;
  
  const newLocation = prompt('Enter new location:', device.location);
  if (!newLocation) return;
  
  try {
    const path = `users/${currentUser.uid}/devices/${deviceId}`;
    const updates = {
      name: newName,
      location: newLocation,
      updatedAt: Date.now()
    };
    
    const result = await updateData(path, updates);
    
    if (result.success) {
      console.log('Device updated');
      // Devices will auto-update via listener
    }
  } catch (error) {
    console.error('Error updating device:', error);
    alert('Failed to update device. Please try again.');
  }
};

/**
 * Delete device
 */
window.deleteDevice = async function(deviceId) {
  const device = devices.find(d => d.id === deviceId);
  if (!device) return;
  
  const confirmed = confirm(`Are you sure you want to delete "${device.name}"?`);
  if (!confirmed) return;
  
  try {
    const path = `users/${currentUser.uid}/devices/${deviceId}`;
    const result = await deleteData(path);
    
    if (result.success) {
      console.log('Device deleted');
      // Devices will auto-update via listener
    }
  } catch (error) {
    console.error('Error deleting device:', error);
    alert('Failed to delete device. Please try again.');
  }
};

/**
 * Start cleaning a device
 */
window.startCleaning = async function(deviceId) {
  const device = devices.find(d => d.id === deviceId);
  if (!device) return;
  
  const confirmed = confirm(`Start cleaning "${device.name}"?\n\nThis will activate the cleaning system.`);
  if (!confirmed) return;
  
  try {
    const path = `users/${currentUser.uid}/devices/${deviceId}`;
    const updates = {
      status: 'cleaning',
      lastCleaned: Date.now(),
      dustLevel: 0,
      updatedAt: Date.now()
    };
    
    const result = await updateData(path, updates);
    
    if (result.success) {
      console.log('Cleaning started');
      alert(`Cleaning started for ${device.name}!\n\nDust level will be reset.`);
      
      // Simulate cleaning completion after 3 seconds
      setTimeout(async () => {
        await updateData(path, { status: 'clean' });
        alert(`Cleaning completed for ${device.name}!`);
      }, 3000);
    }
  } catch (error) {
    console.error('Error starting cleaning:', error);
    alert('Failed to start cleaning. Please try again.');
  }
};

/**
 * Toggle cleaning mode between manual and auto
 */
window.toggleCleaningMode = async function(deviceId) {
  const device = devices.find(d => d.id === deviceId);
  if (!device) return;
  
  const newMode = device.cleaningMode === 'auto' ? 'manual' : 'auto';
  const confirmed = confirm(`Switch "${device.name}" to ${newMode.toUpperCase()} mode?\n\n${newMode === 'auto' ? 'The device will clean automatically when dust level exceeds 50%.' : 'You will need to manually trigger cleaning.'}`);
  
  if (!confirmed) return;
  
  try {
    const path = `users/${currentUser.uid}/devices/${deviceId}`;
    const updates = {
      cleaningMode: newMode,
      updatedAt: Date.now()
    };
    
    const result = await updateData(path, updates);
    
    if (result.success) {
      console.log('Cleaning mode updated');
      alert(`${device.name} switched to ${newMode.toUpperCase()} mode!`);
    }
  } catch (error) {
    console.error('Error updating cleaning mode:', error);
    alert('Failed to update cleaning mode. Please try again.');
  }
};

/**
 * Format timestamp to readable date
 */
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  
  return date.toLocaleDateString();
}

/**
 * Handle logout
 */
async function handleLogout() {
  const confirmed = confirm('Are you sure you want to logout?');
  if (!confirmed) return;
  
  try {
    // Cleanup listener
    if (devicesListener) {
      devicesListener();
    }
    
    const result = await logoutUser();
    
    if (result.success) {
      // Clear local storage
      localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
      
      // Redirect to login
      window.location.href = '../auth/login.html';
    }
  } catch (error) {
    console.error('Logout error:', error);
    alert('Failed to logout. Please try again.');
  }
}

/**
 * Toggle mobile sidebar
 */
function toggleMobileSidebar() {
  sidebar.classList.toggle('open');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  logoutBtn.addEventListener('click', handleLogout);
  addDeviceBtn.addEventListener('click', window.showAddDeviceModal);
  mobileMenuToggle.addEventListener('click', toggleMobileSidebar);
  
  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 1024) {
      if (!sidebar.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    }
  });
}

/**
 * Initialize dashboard
 */
async function init() {
  console.log('Dashboard initialized');
  
  await initAuth();
  setupEventListeners();
  
  // Monitor auth state changes
  onAuthStateChange((authState) => {
    if (!authState.authenticated) {
      window.location.href = '../auth/login.html?error=auth_required';
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (devicesListener) {
    devicesListener();
  }
});
