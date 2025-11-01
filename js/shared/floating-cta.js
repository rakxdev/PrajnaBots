/**
 * Smart Floating CTA Buttons
 * Shows on non-home pages, hides when CTA section is visible
 */

(function() {
  'use strict';

  // Only run on non-home pages
  const path = window.location.pathname;
  const page = path.split('/').pop() || 'index.html';
  
  if (page === 'index.html' || page === '') {
    return; // Don't show on homepage
  }

  // Create floating CTA container
  const floatingCTA = document.createElement('div');
  floatingCTA.className = 'floating-cta-container';
  floatingCTA.innerHTML = `
    <a href="auth/register.html" class="floating-cta-btn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="8.5" cy="7" r="4"/>
        <line x1="20" y1="8" x2="20" y2="14"/>
        <line x1="23" y1="11" x2="17" y2="11"/>
      </svg>
      Get Started Free
    </a>
    <a href="auth/login.html" class="floating-cta-btn secondary">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
        <polyline points="10 17 15 12 10 7"/>
        <line x1="15" y1="12" x2="3" y2="12"/>
      </svg>
      Login
    </a>
  `;

  // Add to page
  document.body.appendChild(floatingCTA);

  // Show after page loads
  setTimeout(() => {
    floatingCTA.classList.add('visible');
  }, 800);

  // Smart hide/show based on CTA section visibility
  function checkCTASectionVisibility() {
    const ctaSection = document.querySelector('.cta-section, .cta-box, .pricing-section, .contact-form-wrapper');
    
    if (!ctaSection) {
      return; // No CTA section, keep buttons visible
    }

    const rect = ctaSection.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Check if CTA section is visible in viewport
    const isVisible = rect.top < windowHeight && rect.bottom > 0;

    if (isVisible) {
      floatingCTA.classList.remove('visible');
      floatingCTA.classList.add('hidden');
    } else {
      floatingCTA.classList.remove('hidden');
      floatingCTA.classList.add('visible');
    }
  }

  // Check on scroll
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(checkCTASectionVisibility, 50);
  }, { passive: true });

  // Initial check after delay
  setTimeout(checkCTASectionVisibility, 1000);

})();
