;(function (global) {
  const Utils = global.AppUtils || {}
  const selectElement = Utils.selectElement || ((selector, scope = document) => scope.querySelector(selector))
  const selectAllElements =
    Utils.selectAllElements || ((selector, scope = document) => Array.from(scope.querySelectorAll(selector)))
  const addClass = Utils.addClass || ((el, cls) => el && el.classList.add(cls))
  const removeClass = Utils.removeClass || ((el, cls) => el && el.classList.remove(cls))
  const hasClass = Utils.hasClass || ((el, cls) => (el ? el.classList.contains(cls) : false))

  let navbar
  let navLinks = []
  let mobileMenu
  let toggleButton
  let overlay
  let initialized = false
  let isMenuOpen = false
  let previousBodyOverflow

  const listeners = []

  const addListener = (element, event, handler, options) => {
    if (!element || !event || !handler) return
    element.addEventListener(event, handler, options)
    listeners.push({ element, event, handler, options })
  }

  const removeAllListeners = () => {
    while (listeners.length) {
      const { element, event, handler, options } = listeners.pop()
      element.removeEventListener(event, handler, options)
    }
  }

  const lockBodyScroll = () => {
    if (isMenuOpen) return
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }

  const unlockBodyScroll = () => {
    document.body.style.overflow = previousBodyOverflow || ''
    previousBodyOverflow = undefined
  }

  const handleScroll = () => {
    if (!navbar) return
    if (window.scrollY > 50) {
      addClass(navbar, 'scrolled')
    } else {
      removeClass(navbar, 'scrolled')
    }
  }

  const setOverlayState = (open) => {
    if (!overlay) return
    if (open) {
      addClass(overlay, 'open')
    } else {
      removeClass(overlay, 'open')
    }
  }

  const toggleMobileMenu = (forceState) => {
    if (!mobileMenu || !toggleButton) return
    const shouldOpen = typeof forceState === 'boolean' ? forceState : !isMenuOpen
    if (shouldOpen) {
      addClass(mobileMenu, 'open')
      addClass(toggleButton, 'open')
      setOverlayState(true)
      lockBodyScroll()
    } else {
      removeClass(mobileMenu, 'open')
      removeClass(toggleButton, 'open')
      setOverlayState(false)
      unlockBodyScroll()
    }
    isMenuOpen = shouldOpen
  }

  const closeMobileMenu = () => {
    if (!isMenuOpen) return
    toggleMobileMenu(false)
  }

  const normalizePath = (href) => {
    try {
      const url = new URL(href, window.location.origin)
      return url.pathname.replace(/\/$/, '') || '/'
    } catch (error) {
      return href
    }
  }

  const setActiveLink = () => {
    if (!navLinks.length) return
    const currentPath = normalizePath(window.location.pathname)
    navLinks.forEach((link) => {
      const href = link.getAttribute('href') || ''
      const path = normalizePath(href)
      if (path && path.startsWith('#')) {
        removeClass(link, 'active')
        return
      }
      if (path === currentPath) {
        addClass(link, 'active')
      } else {
        removeClass(link, 'active')
      }
    })
  }

  const handleClickOutside = (event) => {
    if (!isMenuOpen) return
    const target = event.target
    if (navbar && navbar.contains(target)) return
    if (mobileMenu && mobileMenu.contains(target)) return
    closeMobileMenu()
  }

  const scrollToHash = (hash) => {
    if (!hash || !hash.startsWith('#')) return
    const target = selectElement(hash)
    if (!target) return
    const offset = navbar ? navbar.offsetHeight : 80
    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset
    if (global.SmoothScroll && typeof global.SmoothScroll.smoothScrollTo === 'function') {
      global.SmoothScroll.smoothScrollTo(targetPosition)
    } else {
      window.scrollTo({ top: targetPosition, behavior: 'smooth' })
    }
  }

  const handleNavLinkClick = (event) => {
    const link = event.currentTarget
    if (!link) return
    const href = link.getAttribute('href') || ''
    if (href.startsWith('#')) {
      event.preventDefault()
      closeMobileMenu()
      scrollToHash(href)
      if (history.pushState) {
        history.pushState(null, '', href)
      } else {
        window.location.hash = href
      }
      return
    }
    if (isMenuOpen) {
      closeMobileMenu()
    }
  }

  const initElements = () => {
    navbar = selectElement('.navbar')
    mobileMenu = selectElement('.navbar-mobile')
    toggleButton = selectElement('.navbar-toggle')
    overlay = selectElement('.navbar-overlay')
    const desktopLinks = selectAllElements('.navbar-nav a')
    const mobileLinks = selectAllElements('.navbar-mobile a')
    navLinks = [...desktopLinks, ...mobileLinks]
  }

  const initNavbar = () => {
    if (initialized) return
    initElements()
    if (!navbar) return

    handleScroll()
    setActiveLink()

    addListener(window, 'scroll', handleScroll, { passive: true })
    if (toggleButton) {
      addListener(toggleButton, 'click', () => toggleMobileMenu())
    }
    if (overlay) {
      addListener(overlay, 'click', closeMobileMenu)
    }
    navLinks.forEach((link) => addListener(link, 'click', handleNavLinkClick))
    addListener(document, 'click', handleClickOutside)
    addListener(window, 'popstate', setActiveLink)

    initialized = true
  }

  const destroyNavbar = () => {
    if (!initialized) return
    removeAllListeners()
    closeMobileMenu()
    initialized = false
  }

  global.Navbar = {
    initNavbar,
    destroyNavbar
  }

  // Initialize after navbar component is loaded
  document.addEventListener('component-loaded', (e) => {
    if (e.detail === 'navbar') {
      setTimeout(initNavbar, 50);
    }
  });
  
  // Fallback for non-component pages
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initNavbar, 100));
  } else {
    setTimeout(initNavbar, 100);
  }
})(window)
