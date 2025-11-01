/**
 * Component Loader
 * Loads HTML component files into placeholder elements
 */

(function() {
  'use strict';

  const COMPONENT_ATTR = 'data-component';
  const COMPONENT_PATH = 'components/';

  /**
   * Load a single component
   */
  async function loadComponent(element) {
    const componentName = element.getAttribute(COMPONENT_ATTR);
    if (!componentName) return;

    try {
      const response = await fetch(`${COMPONENT_PATH}${componentName}.html`);
      if (!response.ok) {
        throw new Error(`Failed to load component: ${componentName}`);
      }
      
      const html = await response.text();
      element.innerHTML = html;
      element.removeAttribute(COMPONENT_ATTR);
      
      // Dispatch custom event for other scripts to hook into
      const event = new CustomEvent('component-loaded', { 
        detail: { componentName, element } 
      });
      document.dispatchEvent(event);

      // Re-initialize navbar after loading
      if (componentName === 'navbar' && window.Navbar) {
        setTimeout(() => {
          window.Navbar.initNavbar();
        }, 50);
      }
    } catch (error) {
      console.error(`Error loading component "${componentName}":`, error);
      element.innerHTML = `<div class="component-error">Failed to load ${componentName}</div>`;
    }
  }

  /**
   * Load all components on the page
   */
  async function loadAllComponents() {
    const components = document.querySelectorAll(`[${COMPONENT_ATTR}]`);
    const loadPromises = Array.from(components).map(loadComponent);
    await Promise.all(loadPromises);
  }

  // Load components when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAllComponents);
  } else {
    loadAllComponents();
  }
})();
