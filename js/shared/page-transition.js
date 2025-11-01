/**
 * Smooth Page Transitions with Loading Bar
 */

(function() {
  'use strict';

  // Create loading bar element
  const loadingBar = document.createElement('div');
  loadingBar.id = 'page-loading-bar';
  document.body.appendChild(loadingBar);

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'page-transition-overlay';
  document.body.appendChild(overlay);

  // Create loading screen with logo
  const loadingScreen = document.createElement('div');
  loadingScreen.className = 'loading-screen';
  loadingScreen.innerHTML = `
    <img src="assets/logos/prajnabots-logo.png" alt="Loading" class="loading-logo">
    <div class="loading-text">Loading<span class="loading-dots"></span></div>
  `;
  document.body.appendChild(loadingScreen);

  let isTransitioning = false;

  // Show loading bar
  function showLoadingBar() {
    loadingBar.style.width = '0%';
    setTimeout(() => {
      loadingBar.style.width = '70%';
    }, 50);
  }

  // Complete loading bar
  function completeLoadingBar() {
    loadingBar.style.width = '100%';
    setTimeout(() => {
      loadingBar.style.width = '0%';
    }, 300);
  }

  // Smooth page transition
  function smoothTransition(url, e) {
    if (isTransitioning) return;
    
    e.preventDefault();
    isTransitioning = true;

    // Show loading screen - CSS will handle the animation automatically
    document.body.classList.add('page-loading');
    loadingScreen.classList.add('active');
    showLoadingBar();

    // Navigate after loading screen is visible
    setTimeout(() => {
      window.location.href = url;
    }, 300);
  }

  // Add transition to all internal links
  function attachTransitions() {
    const links = document.querySelectorAll('a[href]');
    
    links.forEach(link => {
      const href = link.getAttribute('href');
      
      // Only for internal pages, not anchors or external
      if (href && 
          href.endsWith('.html') && 
          !href.startsWith('http') && 
          !href.startsWith('#')) {
        
        link.addEventListener('click', (e) => {
          smoothTransition(href, e);
        });
      }
    });
  }

  // Hide loading screen on page load
  function hideLoadingScreen() {
    document.body.classList.remove('page-loading');
    document.body.classList.add('page-loaded');
    loadingScreen.classList.remove('active');
    completeLoadingBar();
    isTransitioning = false;
  }

  // Page load complete
  window.addEventListener('load', () => {
    hideLoadingScreen();
    
    // Attach transitions after a delay to ensure DOM is ready
    setTimeout(attachTransitions, 500);
  });

  // Show loading on page start
  document.addEventListener('DOMContentLoaded', () => {
    showLoadingBar();
    
    // Attach transitions
    setTimeout(attachTransitions, 300);
  });

  // Re-attach after components load
  document.addEventListener('component-loaded', () => {
    setTimeout(attachTransitions, 100);
  });

  // Handle browser back/forward buttons - don't show loading screen
  window.addEventListener('pageshow', (event) => {
    if (event.persisted || performance.getEntriesByType('navigation')[0]?.type === 'back_forward') {
      // Page was loaded from cache (back/forward button)
      hideLoadingScreen();
    }
  });

  // Ensure loading screen is hidden if page is shown from cache
  window.addEventListener('pagehide', () => {
    // Clean up when leaving page
    isTransitioning = false;
  });

})();
