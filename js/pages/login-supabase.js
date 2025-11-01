/**
 * Login Page - Supabase Authentication
 * Email + Password Login
 */

import {
  loginWithEmail,
  redirectIfAuthenticated
} from '../core/supabase-auth.js';

// Check if already logged in
redirectIfAuthenticated();

// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const googleSignInBtn = document.getElementById('googleSignIn');

// Create alert element if it doesn't exist
let alertBox = document.getElementById('alert');
if (!alertBox) {
  alertBox = document.createElement('div');
  alertBox.id = 'alert';
  alertBox.className = 'alert';
  document.querySelector('.auth-container').insertBefore(alertBox, loginForm);
}

/**
 * Show alert message
 */
function showAlert(message, type = 'error') {
  alertBox.textContent = message;
  alertBox.className = `alert ${type} visible`;
  alertBox.style.cssText = `
    padding: 12px 16px;
    margin-bottom: 20px;
    border-radius: 8px;
    font-size: 14px;
    display: block;
    ${type === 'error' ? 'background: #fee; color: #c33; border: 1px solid #fcc;' : ''}
    ${type === 'success' ? 'background: #efe; color: #3c3; border: 1px solid #cfc;' : ''}
    ${type === 'info' ? 'background: #eef; color: #33c; border: 1px solid #ccf;' : ''}
  `;
  
  if (type === 'success') {
    setTimeout(() => {
      alertBox.style.display = 'none';
    }, 5000);
  }
}

/**
 * Set loading state
 */
function setLoading(isLoading) {
  if (isLoading) {
    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing in...';
    loginBtn.style.opacity = '0.7';
    loginBtn.style.cursor = 'not-allowed';
    if (googleSignInBtn) googleSignInBtn.disabled = true;
  } else {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign In';
    loginBtn.style.opacity = '1';
    loginBtn.style.cursor = 'pointer';
    if (googleSignInBtn) googleSignInBtn.disabled = false;
  }
}

/**
 * Validate form
 */
function validateForm() {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email) {
    showAlert('Please enter your email address.', 'error');
    emailInput.focus();
    return false;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showAlert('Please enter a valid email address.', 'error');
    emailInput.focus();
    return false;
  }

  if (!password) {
    showAlert('Please enter your password.', 'error');
    passwordInput.focus();
    return false;
  }

  if (password.length < 6) {
    showAlert('Password must be at least 6 characters.', 'error');
    passwordInput.focus();
    return false;
  }

  return true;
}

/**
 * Handle login
 */
async function handleLogin(e) {
  e.preventDefault();

  if (!validateForm()) return;

  setLoading(true);

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  const result = await loginWithEmail(email, password);

  if (result.success) {
    showAlert(result.message, 'success');
    
    // Redirect to dashboard after login
    setTimeout(() => {
      const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
      if (redirectUrl) {
        sessionStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectUrl;
      } else {
        window.location.href = '../dashboard/index.html';
      }
    }, 1000);
  } else {
    showAlert(result.message, 'error');
    setLoading(false);
  }
}

// Event listeners
if (loginForm) {
  loginForm.addEventListener('submit', handleLogin);
}

// Hide Google Sign-In button (not implemented yet)
if (googleSignInBtn) {
  googleSignInBtn.style.display = 'none';
}

// Check for URL parameters
const urlParams = new URLSearchParams(window.location.search);
const message = urlParams.get('message');
if (message === 'registered') {
  showAlert('Registration successful! Please log in.', 'success');
}
if (message === 'verified') {
  showAlert('Email verified! You can now log in.', 'success');
}

console.log('✅ Login page initialized with Supabase');
