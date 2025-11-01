/**
 * Mobile Navbar Toggle Functionality
 */
(function() {
  'use strict';

  let initialized = false;

  // Wait for DOM and component to load
  function initMobileNav() {
    // Prevent multiple initializations
    if (initialized) {
      return;
    }

    const toggle = document.querySelector('[data-navbar-toggle]');
    const closeBtn = document.querySelector('[data-navbar-close]');
    const mobileMenu = document.querySelector('[data-navbar-mobile]');
    const overlay = document.querySelector('[data-navbar-overlay]');
    const mobileLinks = document.querySelectorAll('.navbar-mobile-link');

    if (!toggle || !mobileMenu || !overlay) {
      // Elements not loaded yet, will try again
      return;
    }

    // Open mobile menu
    function openMobileMenu() {
      toggle.classList.add('open');
      mobileMenu.classList.add('open');
      overlay.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    // Close mobile menu
    function closeMobileMenu() {
      toggle.classList.remove('open');
      mobileMenu.classList.remove('open');
      overlay.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    // Toggle mobile menu
    function toggleMobileMenu(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const isOpen = mobileMenu.classList.contains('open');
      
      if (isOpen) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    }

    // Event listeners
    toggle.addEventListener('click', toggleMobileMenu, { capture: true });
    
    // Close button
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeMobileMenu();
      });
    }
    
    // Overlay click
    overlay.addEventListener('click', (e) => {
      e.preventDefault();
      closeMobileMenu();
    });
    
    // Close menu when clicking a link
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        setTimeout(closeMobileMenu, 100);
      });
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        closeMobileMenu();
      }
    });

    // Close menu on window resize to desktop size
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.innerWidth >= 1024 && mobileMenu.classList.contains('open')) {
          closeMobileMenu();
        }
      }, 250);
    });

    initialized = true;
    console.log('Mobile navbar initialized');
  }

  // Try to initialize multiple times to ensure elements are loaded
  function tryInit() {
    setTimeout(() => initMobileNav(), 100);
    setTimeout(() => initMobileNav(), 300);
    setTimeout(() => initMobileNav(), 500);
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInit);
  } else {
    tryInit();
  }

  // Re-initialize on component-loaded event
  document.addEventListener('component-loaded', (e) => {
    if (e.detail === 'navbar') {
      initialized = false; // Reset to allow re-init
      setTimeout(() => initMobileNav(), 50);
    }
  });
})();
