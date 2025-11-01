/**
 * Simple Active Navigation Highlighter
 * Sets active class on current page link
 */

(function() {
  'use strict';

  function setActiveNav() {
    // Get current page name
    const path = window.location.pathname;
    let page = path.split('/').pop() || 'index.html';
    
    // Treat empty or root as index.html
    if (page === '' || page === '/') {
      page = 'index.html';
    }
    
    console.log('Current page:', page); // Debug
    
    // Get all nav links
    const links = document.querySelectorAll('.navbar-link');
    
    // Remove all active classes
    links.forEach(link => {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    });
    
    // Add active class to current page
    links.forEach(link => {
      const href = link.getAttribute('href') || '';
      
      // Check if this link matches current page
      const isMatch = href === page || 
                     (page === 'index.html' && href === 'index.html') ||
                     (page === 'index.html' && href === '/') ||
                     (page === '' && href === 'index.html');
      
      if (isMatch) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
        console.log('Set active:', href); // Debug
      }
    });
  }

  // Run multiple times to ensure it works
  setTimeout(setActiveNav, 100);
  setTimeout(setActiveNav, 300);
  setTimeout(setActiveNav, 500);
  
  // Also run on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setActiveNav);
  } else {
    setActiveNav();
  }
  
  // Run after component loads
  document.addEventListener('component-loaded', (e) => {
    if (e.detail && e.detail.componentName === 'navbar') {
      setTimeout(setActiveNav, 50);
      setTimeout(setActiveNav, 200);
    }
  });
  
})();
