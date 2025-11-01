/**
 * Login Page JavaScript
 * Handles user authentication via email/password and Google
 */

import {
  loginUser,
  loginWithGoogle,
  resetPassword,
  redirectIfAuthenticated,
  onAuthStateChange
} from '../core/auth.js';

import {
  saveToLocal,
  getFromSession,
  removeFromSession,
  STORAGE_KEYS
} from '../core/storage.js';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const rememberMeCheckbox = document.getElementById('rememberMe');
const loginBtn = document.getElementById('loginBtn');
const googleSignInBtn = document.getElementById('googleSignIn');
const forgotPasswordLink = document.getElementById('forgotPassword');
const alertBox = document.getElementById('alert');

// Error elements
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');

/**
 * Show alert message
 */
function showAlert(message, type = 'error') {
  alertBox.textContent = message;
  alertBox.className = `alert ${type} visible`;
  
  // Auto-hide after 5 seconds for success messages
  if (type === 'success') {
    setTimeout(() => {
      alertBox.classList.remove('visible');
    }, 5000);
  }
}

/**
 * Hide alert message
 */
function hideAlert() {
  alertBox.classList.remove('visible');
}

/**
 * Show field error
 */
function showFieldError(errorElement, message) {
  errorElement.textContent = message;
  errorElement.classList.add('visible');
  errorElement.previousElementSibling.classList.add('error');
}

/**
 * Hide field error
 */
function hideFieldError(errorElement) {
  errorElement.classList.remove('visible');
  errorElement.previousElementSibling.classList.remove('error');
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate form inputs
 */
function validateForm() {
  let isValid = true;
  hideAlert();

  // Validate email
  const email = emailInput.value.trim();
  if (!email) {
    showFieldError(emailError, 'Email is required');
    isValid = false;
  } else if (!isValidEmail(email)) {
    showFieldError(emailError, 'Please enter a valid email address');
    isValid = false;
  } else {
    hideFieldError(emailError);
  }

  // Validate password
  const password = passwordInput.value;
  if (!password) {
    showFieldError(passwordError, 'Password is required');
    isValid = false;
  } else if (password.length < 6) {
    showFieldError(passwordError, 'Password must be at least 6 characters');
    isValid = false;
  } else {
    hideFieldError(passwordError);
  }

  return isValid;
}

/**
 * Set loading state
 */
function setLoading(isLoading) {
  if (isLoading) {
    loginBtn.disabled = true;
    loginBtn.classList.add('loading');
    loginBtn.textContent = 'Signing in';
    googleSignInBtn.disabled = true;
  } else {
    loginBtn.disabled = false;
    loginBtn.classList.remove('loading');
    loginBtn.textContent = 'Sign In';
    googleSignInBtn.disabled = false;
  }
}

/**
 * Handle successful login
 */
function handleLoginSuccess(user, rememberMe) {
  console.log('Login successful:', user);

  // Save session if remember me is checked
  if (rememberMe) {
    saveToLocal(STORAGE_KEYS.USER_SESSION, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
      timestamp: Date.now()
    });
  }

  // Check for redirect URL
  const redirectUrl = getFromSession(STORAGE_KEYS.REDIRECT_URL);
  if (redirectUrl) {
    removeFromSession(STORAGE_KEYS.REDIRECT_URL);
    window.location.href = redirectUrl;
  } else {
    // Default redirect to dashboard
    window.location.href = '../dashboard/overview.html';
  }
}

/**
 * Handle login form submission
 */
async function handleLogin(e) {
  e.preventDefault();

  // Validate form
  if (!validateForm()) {
    return;
  }

  setLoading(true);
  hideAlert();

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const rememberMe = rememberMeCheckbox.checked;

  try {
    const result = await loginUser(email, password);

    if (result.success) {
      showAlert(result.message, 'success');
      handleLoginSuccess(result.user, rememberMe);
    } else {
      showAlert(result.message, 'error');
      setLoading(false);
    }
  } catch (error) {
    console.error('Login error:', error);
    showAlert('An unexpected error occurred. Please try again.', 'error');
    setLoading(false);
  }
}

/**
 * Handle Google Sign-In
 */
async function handleGoogleSignIn() {
  setLoading(true);
  hideAlert();

  try {
    const result = await loginWithGoogle();

    if (result.success) {
      showAlert(result.message, 'success');
      handleLoginSuccess(result.user, false);
    } else {
      showAlert(result.message, 'error');
      setLoading(false);
    }
  } catch (error) {
    console.error('Google sign-in error:', error);
    showAlert('An unexpected error occurred. Please try again.', 'error');
    setLoading(false);
  }
}

/**
 * Handle forgot password
 */
async function handleForgotPassword(e) {
  e.preventDefault();
  hideAlert();

  const email = emailInput.value.trim();

  if (!email) {
    showAlert('Please enter your email address first', 'error');
    emailInput.focus();
    return;
  }

  if (!isValidEmail(email)) {
    showAlert('Please enter a valid email address', 'error');
    emailInput.focus();
    return;
  }

  // Confirm with user
  const confirmed = confirm(`Send password reset email to ${email}?`);
  if (!confirmed) {
    return;
  }

  setLoading(true);

  try {
    const result = await resetPassword(email);

    if (result.success) {
      showAlert(result.message, 'success');
    } else {
      showAlert(result.message, 'error');
    }
  } catch (error) {
    console.error('Password reset error:', error);
    showAlert('Failed to send password reset email. Please try again.', 'error');
  } finally {
    setLoading(false);
  }
}

/**
 * Clear errors on input
 */
function setupInputValidation() {
  emailInput.addEventListener('input', () => {
    if (emailInput.value.trim()) {
      hideFieldError(emailError);
    }
  });

  passwordInput.addEventListener('input', () => {
    if (passwordInput.value) {
      hideFieldError(passwordError);
    }
  });
}

/**
 * Initialize page
 */
function init() {
  console.log('Login page initialized');

  // Redirect if already authenticated
  redirectIfAuthenticated();

  // Setup event listeners
  loginForm.addEventListener('submit', handleLogin);
  googleSignInBtn.addEventListener('click', handleGoogleSignIn);
  forgotPasswordLink.addEventListener('click', handleForgotPassword);

  // Setup input validation
  setupInputValidation();

  // Auto-fill email if passed from registration
  const urlParams = new URLSearchParams(window.location.search);
  const emailParam = urlParams.get('email');
  if (emailParam) {
    emailInput.value = emailParam;
    showAlert('Registration successful! Please log in with your credentials.', 'success');
  }

  // Check for error message
  const errorParam = urlParams.get('error');
  if (errorParam === 'auth_required') {
    showAlert('Please log in to access that page.', 'error');
  }

  // Focus email input
  emailInput.focus();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
