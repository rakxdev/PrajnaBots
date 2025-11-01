/**
 * Register Page JavaScript
 * Handles user registration via email/password and Google
 */

import {
  registerUser,
  loginWithGoogle,
  redirectIfAuthenticated
} from '../core/auth.js';

// DOM Elements
const registerForm = document.getElementById('registerForm');
const fullNameInput = document.getElementById('fullName');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const termsCheckbox = document.getElementById('termsCheckbox');
const registerBtn = document.getElementById('registerBtn');
const googleSignUpBtn = document.getElementById('googleSignUp');
const alertBox = document.getElementById('alert');

// Error elements
const nameError = document.getElementById('nameError');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const confirmPasswordError = document.getElementById('confirmPasswordError');
const termsError = document.getElementById('termsError');

// Password strength elements
const strengthBars = document.querySelectorAll('.strength-bar');
const strengthText = document.getElementById('strengthText');

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
  if (errorElement.previousElementSibling && errorElement.previousElementSibling.tagName === 'INPUT') {
    errorElement.previousElementSibling.classList.add('error');
  }
}

/**
 * Hide field error
 */
function hideFieldError(errorElement) {
  errorElement.classList.remove('visible');
  if (errorElement.previousElementSibling && errorElement.previousElementSibling.tagName === 'INPUT') {
    errorElement.previousElementSibling.classList.remove('error');
  }
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Calculate password strength
 */
function calculatePasswordStrength(password) {
  let strength = 0;
  
  if (password.length >= 6) strength++;
  if (password.length >= 10) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  
  return Math.min(strength, 4);
}

/**
 * Update password strength indicator
 */
function updatePasswordStrength() {
  const password = passwordInput.value;
  const strength = calculatePasswordStrength(password);
  
  // Reset all bars
  strengthBars.forEach(bar => {
    bar.classList.remove('active', 'weak', 'medium', 'strong');
  });
  
  if (password.length === 0) {
    strengthText.textContent = '';
    return;
  }
  
  // Update bars based on strength
  let strengthClass = '';
  let strengthLabel = '';
  
  if (strength <= 1) {
    strengthClass = 'weak';
    strengthLabel = 'Weak password';
  } else if (strength === 2) {
    strengthClass = 'medium';
    strengthLabel = 'Medium password';
  } else if (strength === 3) {
    strengthClass = 'strong';
    strengthLabel = 'Strong password';
  } else {
    strengthClass = 'strong';
    strengthLabel = 'Very strong password';
  }
  
  for (let i = 0; i < strength; i++) {
    strengthBars[i].classList.add('active', strengthClass);
  }
  
  strengthText.textContent = strengthLabel;
  strengthText.style.color = strengthClass === 'weak' ? '#ef4444' : 
                              strengthClass === 'medium' ? '#f59e0b' : '#10b981';
}

/**
 * Validate form inputs
 */
function validateForm() {
  let isValid = true;
  hideAlert();

  // Validate full name
  const fullName = fullNameInput.value.trim();
  if (!fullName) {
    showFieldError(nameError, 'Full name is required');
    isValid = false;
  } else if (fullName.length < 2) {
    showFieldError(nameError, 'Name must be at least 2 characters');
    isValid = false;
  } else {
    hideFieldError(nameError);
  }

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

  // Validate confirm password
  const confirmPassword = confirmPasswordInput.value;
  if (!confirmPassword) {
    showFieldError(confirmPasswordError, 'Please confirm your password');
    isValid = false;
  } else if (password !== confirmPassword) {
    showFieldError(confirmPasswordError, 'Passwords do not match');
    isValid = false;
  } else {
    hideFieldError(confirmPasswordError);
  }

  // Validate terms acceptance
  if (!termsCheckbox.checked) {
    showFieldError(termsError, 'You must accept the terms to continue');
    isValid = false;
  } else {
    hideFieldError(termsError);
  }

  return isValid;
}

/**
 * Set loading state
 */
function setLoading(isLoading) {
  if (isLoading) {
    registerBtn.disabled = true;
    registerBtn.classList.add('loading');
    registerBtn.textContent = 'Creating Account';
    googleSignUpBtn.disabled = true;
  } else {
    registerBtn.disabled = false;
    registerBtn.classList.remove('loading');
    registerBtn.textContent = 'Create Account';
    googleSignUpBtn.disabled = false;
  }
}

/**
 * Handle successful registration
 */
function handleRegistrationSuccess(email) {
  console.log('Registration successful');
  
  // Show success message
  showAlert('Account created successfully! Please check your email to verify your account.', 'success');
  
  // Redirect to login after 3 seconds
  setTimeout(() => {
    window.location.href = `login.html?email=${encodeURIComponent(email)}`;
  }, 3000);
}

/**
 * Handle registration form submission
 */
async function handleRegister(e) {
  e.preventDefault();

  // Validate form
  if (!validateForm()) {
    return;
  }

  setLoading(true);
  hideAlert();

  const fullName = fullNameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  try {
    const result = await registerUser(email, password, fullName);

    if (result.success) {
      handleRegistrationSuccess(email);
    } else {
      showAlert(result.message, 'error');
      setLoading(false);
    }
  } catch (error) {
    console.error('Registration error:', error);
    showAlert('An unexpected error occurred. Please try again.', 'error');
    setLoading(false);
  }
}

/**
 * Handle Google Sign-Up
 */
async function handleGoogleSignUp() {
  setLoading(true);
  hideAlert();

  try {
    const result = await loginWithGoogle();

    if (result.success) {
      showAlert('Account created successfully!', 'success');
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = '../dashboard/overview.html';
      }, 1000);
    } else {
      showAlert(result.message, 'error');
      setLoading(false);
    }
  } catch (error) {
    console.error('Google sign-up error:', error);
    showAlert('An unexpected error occurred. Please try again.', 'error');
    setLoading(false);
  }
}

/**
 * Setup input validation
 */
function setupInputValidation() {
  fullNameInput.addEventListener('input', () => {
    if (fullNameInput.value.trim()) {
      hideFieldError(nameError);
    }
  });

  emailInput.addEventListener('input', () => {
    if (emailInput.value.trim()) {
      hideFieldError(emailError);
    }
  });

  passwordInput.addEventListener('input', () => {
    updatePasswordStrength();
    if (passwordInput.value) {
      hideFieldError(passwordError);
    }
    // Revalidate confirm password if it has a value
    if (confirmPasswordInput.value) {
      if (passwordInput.value === confirmPasswordInput.value) {
        hideFieldError(confirmPasswordError);
      } else {
        showFieldError(confirmPasswordError, 'Passwords do not match');
      }
    }
  });

  confirmPasswordInput.addEventListener('input', () => {
    if (confirmPasswordInput.value) {
      if (passwordInput.value === confirmPasswordInput.value) {
        hideFieldError(confirmPasswordError);
      } else {
        showFieldError(confirmPasswordError, 'Passwords do not match');
      }
    }
  });

  termsCheckbox.addEventListener('change', () => {
    if (termsCheckbox.checked) {
      hideFieldError(termsError);
    }
  });
}

/**
 * Initialize page
 */
function init() {
  console.log('Register page initialized');

  // Redirect if already authenticated
  redirectIfAuthenticated();

  // Setup event listeners
  registerForm.addEventListener('submit', handleRegister);
  googleSignUpBtn.addEventListener('click', handleGoogleSignUp);

  // Setup input validation
  setupInputValidation();

  // Focus full name input
  fullNameInput.focus();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
