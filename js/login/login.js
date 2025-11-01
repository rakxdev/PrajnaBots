/**
 * Login Page Logic
 */

(function() {
  'use strict';

  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const emailError = document.getElementById('email-error');
  const passwordError = document.getElementById('password-error');
  const togglePasswordBtn = document.querySelector('[data-toggle-password]');

  // Toggle password visibility
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      
      // Update icon
      const svg = togglePasswordBtn.querySelector('svg');
      if (type === 'text') {
        svg.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
      } else {
        svg.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
      }
    });
  }

  // Form validation
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  function validatePassword(password) {
    return password.length >= 6;
  }

  function showError(element, message) {
    element.textContent = message;
    element.previousElementSibling?.classList.add('input--error');
  }

  function clearError(element) {
    element.textContent = '';
    element.previousElementSibling?.classList.remove('input--error');
  }

  // Real-time validation
  emailInput?.addEventListener('blur', () => {
    if (!emailInput.value) {
      showError(emailError, 'Email is required');
    } else if (!validateEmail(emailInput.value)) {
      showError(emailError, 'Please enter a valid email address');
    } else {
      clearError(emailError);
    }
  });

  passwordInput?.addEventListener('blur', () => {
    if (!passwordInput.value) {
      showError(passwordError, 'Password is required');
    } else if (!validatePassword(passwordInput.value)) {
      showError(passwordError, 'Password must be at least 6 characters');
    } else {
      clearError(passwordError);
    }
  });

  // Form submission
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear previous errors
    clearError(emailError);
    clearError(passwordError);

    let isValid = true;

    // Validate email
    if (!emailInput.value) {
      showError(emailError, 'Email is required');
      isValid = false;
    } else if (!validateEmail(emailInput.value)) {
      showError(emailError, 'Please enter a valid email address');
      isValid = false;
    }

    // Validate password
    if (!passwordInput.value) {
      showError(passwordError, 'Password is required');
      isValid = false;
    } else if (!validatePassword(passwordInput.value)) {
      showError(passwordError, 'Password must be at least 6 characters');
      isValid = false;
    }

    if (!isValid) return;

    // Simulate login (replace with actual API call)
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Signing in...';
    submitBtn.disabled = true;

    setTimeout(() => {
      // Simulate successful login
      console.log('Login attempt:', {
        email: emailInput.value,
        remember: document.getElementById('remember').checked
      });

      // Redirect to dashboard
      window.location.href = 'dashboard.html';
    }, 1500);
  });
})();
