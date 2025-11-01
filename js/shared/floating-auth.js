/**
 * Smart Floating Auth Buttons
 * Shows Login/Register floating buttons on non-auth pages
 * SMART BEHAVIOR: Hides when CTA buttons are visible in viewport
 */

(function() {
  'use strict';

  // Check if we're on an auth page
  const isAuthPage = window.location.pathname.includes('/auth/');
  const isDashboard = window.location.pathname.includes('/dashboard/');
  const isHomePage = window.location.pathname === '/' || 
                      window.location.pathname.endsWith('index.html') || 
                      window.location.pathname === '';
  
  // Don't show on auth, dashboard, or homepage
  if (isAuthPage || isDashboard || isHomePage) {
    return;
  }

  // Create floating auth container
  const floatingAuth = document.createElement('div');
  floatingAuth.className = 'floating-auth';
  floatingAuth.innerHTML = `
    <a href="auth/login.html" class="floating-auth-btn floating-auth-login" title="Login">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
        <polyline points="10 17 15 12 10 7"></polyline>
        <line x1="15" y1="12" x2="3" y2="12"></line>
      </svg>
      <span>Login</span>
    </a>
    <a href="auth/register.html" class="floating-auth-btn floating-auth-register" title="Sign Up">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="8.5" cy="7" r="4"></circle>
        <line x1="20" y1="8" x2="20" y2="14"></line>
        <line x1="23" y1="11" x2="17" y2="11"></line>
      </svg>
      <span>Sign Up</span>
    </a>
  `;

  // Add styles with hidden state
  const styles = document.createElement('style');
  styles.textContent = `
    .floating-auth {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      z-index: 1000;
      opacity: 1;
      transform: translateY(0);
      transition: opacity 0.4s ease, transform 0.4s ease;
      pointer-events: auto;
    }

    .floating-auth.hidden {
      opacity: 0;
      transform: translateY(20px);
      pointer-events: none;
    }

    .floating-auth-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border-radius: 50px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
    }

    .floating-auth-login {
      background: white;
      color: #3b82f6;
      border: 2px solid #3b82f6;
    }

    .floating-auth-login:hover {
      background: #3b82f6;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
    }

    .floating-auth-register {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: 2px solid transparent;
    }

    .floating-auth-register:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
    }

    .floating-auth-btn svg {
      flex-shrink: 0;
    }

    .floating-auth-btn span {
      white-space: nowrap;
    }

    @media (max-width: 768px) {
      .floating-auth {
        bottom: 16px;
        right: 16px;
      }

      .floating-auth-btn {
        padding: 10px 16px;
        font-size: 13px;
      }

      .floating-auth-btn span {
        display: none;
      }

      .floating-auth-btn {
        width: 48px;
        height: 48px;
        padding: 0;
        justify-content: center;
      }
    }
  `;

  // Add to page
  document.head.appendChild(styles);
  document.body.appendChild(floatingAuth);

  // SMART VISIBILITY LOGIC
  // Define selectors for major CTA sections (not individual buttons to avoid false positives)
  const ctaSelectors = [
    '.cta-section',                  // CTA sections
    '.cta-box',                      // CTA boxes
    '.cta-buttons',                  // CTA button groups (multiple buttons together)
    '.pricing-section',              // Pricing sections
    '.pricing-card',                 // Pricing cards
    '.contact-form-wrapper',         // Contact form sections
    'form.contact-form',             // Contact forms specifically
    '.hero-cta-group',               // Hero CTA groups (homepage)
    '.pricing-grid',                 // Pricing grids
    '.page-hero .cta-buttons'        // Page hero CTA sections
  ];

  /**
   * Check if any CTA sections are prominently visible in viewport
   */
  function checkCTAVisibility() {
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    let ctaVisible = false;

    // Check each CTA selector
    for (const selector of ctaSelectors) {
      const elements = document.querySelectorAll(selector);
      
      for (const element of elements) {
        // Skip if element is the floating auth itself
        if (element.closest('.floating-auth')) {
          continue;
        }

        const rect = element.getBoundingClientRect();
        
        // Calculate how much of the element is visible in viewport
        const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
        const elementHeight = rect.height;
        const visibilityRatio = elementHeight > 0 ? visibleHeight / elementHeight : 0;
        
        // Only hide floating buttons if CTA section is SIGNIFICANTLY visible
        // (at least 30% of the section is in viewport AND it has reasonable dimensions)
        const isSignificantlyVisible = (
          visibilityRatio > 0.3 &&              // At least 30% of element visible
          rect.height > 50 &&                   // Element has reasonable height
          rect.width > 100 &&                   // Element has reasonable width
          rect.top < viewportHeight - 150 &&   // Element top is above bottom of viewport
          rect.bottom > 150                     // Element bottom is below top of viewport
        );

        if (isSignificantlyVisible) {
          ctaVisible = true;
          console.log('CTA detected:', selector, 'visibility:', Math.round(visibilityRatio * 100) + '%');
          break;
        }
      }

      if (ctaVisible) break;
    }

    // Update floating auth visibility
    if (ctaVisible) {
      floatingAuth.classList.add('hidden');
    } else {
      floatingAuth.classList.remove('hidden');
    }
  }

  // Throttle function to optimize performance
  function throttle(func, delay) {
    let lastCall = 0;
    return function(...args) {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  }

  // Check visibility on scroll (throttled to every 150ms)
  const throttledCheck = throttle(checkCTAVisibility, 150);
  window.addEventListener('scroll', throttledCheck, { passive: true });

  // Check visibility on resize
  window.addEventListener('resize', throttledCheck, { passive: true });

  // Show buttons initially with delay, then check visibility
  setTimeout(() => {
    floatingAuth.classList.remove('hidden');
  }, 800);

  // Wait longer before starting visibility checks (let page fully load)
  setTimeout(() => {
    checkCTAVisibility();
  }, 2000);

  console.log('Smart floating auth buttons loaded with viewport detection');
})();
