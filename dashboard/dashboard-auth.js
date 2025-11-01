/**
 * Dashboard Authentication Module
 * Handles Supabase authentication for dashboard pages
 */

// Import Supabase client from parent directory
import { supabase } from '../js/config/supabase-config.js';

/**
 * Initialize dashboard authentication
 */
async function initDashboardAuth() {
  try {
    // Check if user is authenticated
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    
    if (!session) {
      // Not logged in - redirect to login page
      console.log('❌ No active session - redirecting to login');
      window.location.href = '../auth/login.html';
      return;
    }
    
    // User is authenticated - display profile
    console.log('✅ User authenticated:', session.user.email);
    displayUserProfile(session.user);
    
  } catch (error) {
    console.error('❌ Authentication error:', error);
    // Redirect to login on error
    window.location.href = '../auth/login.html';
  }
}

/**
 * Display user profile in sidebar
 */
function displayUserProfile(user) {
  const logoutBtn = document.querySelector('.logout');
  
  if (!logoutBtn) {
    console.error('❌ Logout button not found');
    return;
  }
  
  // Create user profile element
  const userProfile = document.createElement('div');
  userProfile.className = 'user-profile';
  userProfile.innerHTML = `
    <div class="user-info">
      <div class="user-avatar">
        <span>${user.email.charAt(0).toUpperCase()}</span>
      </div>
      <div class="user-details">
        <span class="user-email">${user.email}</span>
      </div>
    </div>
  `;
  
  // Add styles for user profile
  const style = document.createElement('style');
  style.textContent = `
    .user-profile {
      padding: var(--spacing-md);
      border-top: 2px solid var(--light-gray);
      border-bottom: 2px solid var(--light-gray);
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      animation: fadeInUp 0.5s ease-out;
    }
    
    .user-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }
    
    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-blue) 0%, var(--electric-blue) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--white);
      font-weight: 700;
      font-size: var(--text-lg);
      box-shadow: var(--shadow-md);
      flex-shrink: 0;
    }
    
    .user-details {
      flex: 1;
      overflow: hidden;
    }
    
    .user-email {
      display: block;
      font-size: var(--text-xs);
      color: var(--slate-gray);
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .logout {
      cursor: pointer;
      transition: all var(--transition-base);
    }
    
    .logout:hover {
      transform: translateY(-1px);
    }
    
    .logout:active {
      transform: translateY(0);
    }
    
    /* Mobile Responsive */
    @media (max-width: 768px) {
      .user-profile {
        padding: var(--spacing-xs);
      }
      
      .user-avatar {
        width: 32px;
        height: 32px;
        font-size: var(--text-sm);
      }
      
      .user-email {
        font-size: 10px;
      }
    }
  `;
  
  // Insert user profile above logout button
  logoutBtn.parentNode.insertBefore(userProfile, logoutBtn);
  
  // Insert styles
  document.head.appendChild(style);
  
  console.log('✅ User profile displayed');
}

/**
 * Handle logout
 */
async function handleLogout() {
  try {
    console.log('🚪 Logging out...');
    
    const { error } = await supabase.auth.signOut();
    
    if (error) throw error;
    
    console.log('✅ Logout successful');
    
    // Redirect to login page
    window.location.href = '../auth/login.html';
    
  } catch (error) {
    console.error('❌ Logout error:', error);
    alert('Failed to logout. Please try again.');
  }
}

/**
 * Setup logout button event listener
 */
function setupLogoutButton() {
  const logoutBtn = document.querySelector('.logout');
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
    console.log('✅ Logout button connected');
  } else {
    console.error('❌ Logout button not found');
  }
}

// Initialize authentication when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    await initDashboardAuth();
    setupLogoutButton();
  });
} else {
  // DOM already loaded
  initDashboardAuth().then(() => {
    setupLogoutButton();
  });
}

console.log('✅ Dashboard authentication module loaded');
