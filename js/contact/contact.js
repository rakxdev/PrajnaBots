/**
 * Contact Form Logic
 */

(function() {
  'use strict';

  const contactForm = document.getElementById('contact-form');

  if (!contactForm) return;

  // Form submission
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get form data
    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData.entries());

    // Basic validation
    const errors = [];
    
    if (!data.firstName) errors.push('First name is required');
    if (!data.lastName) errors.push('Last name is required');
    if (!data.email) errors.push('Email is required');
    if (!data.inquiryType) errors.push('Please select an inquiry type');
    if (!data.message) errors.push('Message is required');

    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    // Simulate form submission
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    setTimeout(() => {
      console.log('Contact form submitted:', data);
      alert('Thank you for your message! We\'ll get back to you within 24 hours.');
      contactForm.reset();
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }, 1500);
  });
})();
