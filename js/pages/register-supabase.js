/**
 * Registration Page - Supabase Authentication
 * Email/OTP Registration
 */

import {
  registerWithEmailOTP,
  verifyEmailOTP,
  redirectIfAuthenticated
} from '../core/supabase-auth.js';

// Check if already logged in
redirectIfAuthenticated();

// DOM Elements
const registerForm = document.getElementById('registerForm');
const fullNameInput = document.getElementById('fullName');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const companyInput = document.getElementById('company');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const registerBtn = document.getElementById('registerBtn');
const googleSignUpBtn = document.getElementById('googleSignUp');

// Create alert element
let alertBox = document.getElementById('alert');
if (!alertBox) {
  alertBox = document.createElement('div');
  alertBox.id = 'alert';
  alertBox.className = 'alert';
  document.querySelector('.auth-container').insertBefore(alertBox, registerForm);
}

// Create OTP verification modal
let otpModal = null;
let otpEmail = '';

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
    registerBtn.disabled = true;
    registerBtn.textContent = 'Creating Account...';
    registerBtn.style.opacity = '0.7';
    if (googleSignUpBtn) googleSignUpBtn.disabled = true;
  } else {
    registerBtn.disabled = false;
    registerBtn.textContent = 'Create Account';
    registerBtn.style.opacity = '1';
    if (googleSignUpBtn) googleSignUpBtn.disabled = false;
  }
}

/**
 * Validate form
 */
function validateForm() {
  const fullName = fullNameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (!fullName) {
    showAlert('Please enter your full name.', 'error');
    fullNameInput.focus();
    return false;
  }

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
    showAlert('Please enter a password.', 'error');
    passwordInput.focus();
    return false;
  }

  if (password.length < 6) {
    showAlert('Password must be at least 6 characters.', 'error');
    passwordInput.focus();
    return false;
  }

  if (password !== confirmPassword) {
    showAlert('Passwords do not match.', 'error');
    confirmPasswordInput.focus();
    return false;
  }

  return true;
}

/**
 * Show OTP verification modal
 */
function showOTPModal(email) {
  otpEmail = email;
  
  // Create modal if it doesn't exist
  if (!otpModal) {
    otpModal = document.createElement('div');
    otpModal.id = 'otpModal';
    otpModal.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
        <div style="background: white; border-radius: 12px; padding: 32px; max-width: 400px; width: 90%;">
          <h2 style="margin: 0 0 16px; font-size: 24px; color: #1e293b;">Verify Your Email</h2>
          <p style="margin: 0 0 24px; color: #64748b;">We sent a verification code to:<br><strong>${email}</strong></p>
          <input type="text" id="otpInput" placeholder="Enter 6-digit code" maxlength="6" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 18px; text-align: center; letter-spacing: 4px; margin-bottom: 16px;">
          <div id="otpError" style="color: #ef4444; font-size: 14px; margin-bottom: 16px; display: none;"></div>
          <button id="verifyOtpBtn" style="width: 100%; padding: 12px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; margin-bottom: 8px;">Verify Code</button>
          <button id="resendOtpBtn" style="width: 100%; padding: 12px; background: transparent; color: #3b82f6; border: 1px solid #3b82f6; border-radius: 8px; font-size: 16px; cursor: pointer; margin-bottom: 8px;">Resend Code</button>
          <button id="closeOtpBtn" style="width: 100%; padding: 12px; background: transparent; color: #64748b; border: none; border-radius: 8px; font-size: 14px; cursor: pointer;">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(otpModal);

    // Add event listeners
    document.getElementById('verifyOtpBtn').addEventListener('click', handleVerifyOTP);
    document.getElementById('resendOtpBtn').addEventListener('click', handleResendOTP);
    document.getElementById('closeOtpBtn').addEventListener('click', closeOTPModal);
    
    // Auto-submit when 6 digits entered
    const otpInput = document.getElementById('otpInput');
    otpInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
      if (e.target.value.length === 6) {
        handleVerifyOTP();
      }
    });
  }
  
  otpModal.style.display = 'block';
  document.getElementById('otpInput').focus();
}

/**
 * Close OTP modal
 */
function closeOTPModal() {
  if (otpModal) {
    otpModal.style.display = 'none';
    document.getElementById('otpInput').value = '';
    document.getElementById('otpError').style.display = 'none';
  }
}

/**
 * Handle OTP verification
 */
async function handleVerifyOTP() {
  const otpInput = document.getElementById('otpInput');
  const otpError = document.getElementById('otpError');
  const verifyBtn = document.getElementById('verifyOtpBtn');
  
  const token = otpInput.value.trim();
  
  if (token.length !== 6) {
    otpError.textContent = 'Please enter the 6-digit code';
    otpError.style.display = 'block';
    return;
  }
  
  verifyBtn.disabled = true;
  verifyBtn.textContent = 'Verifying...';
  
  const result = await verifyEmailOTP(otpEmail, token);
  
  if (result.success) {
    closeOTPModal();
    showAlert('Email verified successfully! Redirecting to dashboard...', 'success');
    setTimeout(() => {
      window.location.href = '../dashboard/index.html';
    }, 2000);
  } else {
    otpError.textContent = result.message;
    otpError.style.display = 'block';
    verifyBtn.disabled = false;
    verifyBtn.textContent = 'Verify Code';
  }
}

/**
 * Handle resend OTP
 */
async function handleResendOTP() {
  const resendBtn = document.getElementById('resendOtpBtn');
  resendBtn.disabled = true;
  resendBtn.textContent = 'Sending...';
  
  // For now, just show a message
  showAlert('A new verification code has been sent to your email.', 'info');
  
  setTimeout(() => {
    resendBtn.disabled = false;
    resendBtn.textContent = 'Resend Code';
  }, 3000);
}

/**
 * Handle registration
 */
async function handleRegister(e) {
  e.preventDefault();

  if (!validateForm()) return;

  setLoading(true);

  const userData = {
    fullName: fullNameInput.value.trim(),
    phone: phoneInput?.value.trim() || '',
    companyName: companyInput?.value.trim() || ''
  };

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  const result = await registerWithEmailOTP(email, password, userData);

  if (result.success) {
    showAlert(result.message, 'success');
    setLoading(false);
    
    // Show OTP modal
    setTimeout(() => {
      showOTPModal(email);
    }, 1000);
  } else {
    showAlert(result.message, 'error');
    setLoading(false);
  }
}

// Event listeners
if (registerForm) {
  registerForm.addEventListener('submit', handleRegister);
}

// Hide Google Sign-Up button (not implemented)
if (googleSignUpBtn) {
  googleSignUpBtn.style.display = 'none';
}

console.log('✅ Registration page initialized with Supabase (Email/OTP)');
