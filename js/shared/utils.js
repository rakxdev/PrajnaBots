;(function (global) {
  const warnMissing = (selector) => {
    // Only warn if not a common component element that loads async
    const asyncSelectors = ['.navbar', '.navbar-mobile', '.navbar-toggle', '.navbar-overlay', '.footer'];
    const isAsyncElement = asyncSelectors.some(s => selector.includes(s));
    if (!isAsyncElement) {
      console.warn(`Element not found for selector: ${selector}`);
    }
  }

  const selectElement = (selector, scope = document) => {
    if (!selector || !scope) return null
    const el = scope.querySelector(selector)
    if (!el) warnMissing(selector)
    return el
  }

  const selectAllElements = (selector, scope = document) => {
    if (!selector || !scope) return []
    return Array.from(scope.querySelectorAll(selector))
  }

  const createElement = (tag, className = '', content = '') => {
    if (!tag) return null
    const el = document.createElement(tag)
    if (className) el.className = className
    if (content) el.innerHTML = content
    return el
  }

  const addClass = (element, className) => {
    if (element && className) element.classList.add(className)
  }

  const removeClass = (element, className) => {
    if (element && className) element.classList.remove(className)
  }

  const toggleClass = (element, className) => {
    if (element && className) element.classList.toggle(className)
  }

  const hasClass = (element, className) => {
    if (!element || !className) return false
    return element.classList.contains(className)
  }

  const addEvent = (element, event, handler, options) => {
    if (element && event && handler) element.addEventListener(event, handler, options)
  }

  const removeEvent = (element, event, handler, options) => {
    if (element && event && handler) element.removeEventListener(event, handler, options)
  }

  const delegateEvent = (parent, selector, event, handler) => {
    if (!parent || !selector || !event || !handler) return
    parent.addEventListener(event, (e) => {
      const potentialTargets = parent.querySelectorAll(selector)
      for (const target of potentialTargets) {
        if (target === e.target || target.contains(e.target)) {
          handler.call(target, e)
          break
        }
      }
    })
  }

  const debounce = (fn, delay = 300) => {
    let timer
    return (...args) => {
      clearTimeout(timer)
      timer = setTimeout(() => fn.apply(this, args), delay)
    }
  }

  const throttle = (fn, limit = 200) => {
    let inThrottle = false
    let lastArgs
    return function throttled(...args) {
      if (!inThrottle) {
        fn.apply(this, args)
        inThrottle = true
        setTimeout(() => {
          inThrottle = false
          if (lastArgs) {
            throttled.apply(this, lastArgs)
            lastArgs = null
          }
        }, limit)
      } else {
        lastArgs = args
      }
    }
  }

  const truncateText = (text, maxLength, suffix = '...') => {
    if (typeof text !== 'string' || typeof maxLength !== 'number') return text
    if (text.length <= maxLength) return text
    return `${text.slice(0, Math.max(0, maxLength - suffix.length))}${suffix}`
  }

  const capitalizeFirst = (value = '') => {
    if (typeof value !== 'string' || !value.length) return value
    return value.charAt(0).toUpperCase() + value.slice(1)
  }

  const toTitleCase = (value = '') => {
    if (typeof value !== 'string') return value
    return value
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map((word) => capitalizeFirst(word))
      .join(' ')
  }

  const slugify = (value = '') => {
    if (typeof value !== 'string') return ''
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  const formatNumber = (number, decimals = 0) => {
    if (typeof number !== 'number' || Number.isNaN(number)) return ''
    return number.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
  }

  const randomInt = (min = 0, max = 1) => {
    const lower = Math.ceil(Math.min(min, max))
    const upper = Math.floor(Math.max(min, max))
    return Math.floor(Math.random() * (upper - lower + 1)) + lower
  }

  const clamp = (value, min = 0, max = 1) => {
    if (typeof value !== 'number') return value
    return Math.min(Math.max(value, min), max)
  }

  const shuffleArray = (array = []) => {
    const copy = Array.isArray(array) ? [...array] : []
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  }

  const uniqueArray = (array = []) => (Array.isArray(array) ? [...new Set(array)] : [])

  const isEmpty = (value) => {
    if (value == null) return true
    if (Array.isArray(value) || typeof value === 'string') return value.length === 0
    if (value instanceof Map || value instanceof Set) return value.size === 0
    if (typeof value === 'object') return Object.keys(value).length === 0
    return false
  }

  const deepClone = (value) => {
    if (typeof structuredClone === 'function') return structuredClone(value)
    return JSON.parse(JSON.stringify(value))
  }

  const isValidEmail = (email) => {
    if (typeof email !== 'string') return false
    return /^[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(\.[\w-]+)+$/.test(email.trim())
  }

  const isValidPhone = (phone) => {
    if (typeof phone !== 'string' && typeof phone !== 'number') return false
    return /^(\+?\d{1,3}[- ]?)?\d{10}$/.test(String(phone).replace(/\D/g, ''))
  }

  const isValidURL = (url) => {
    if (typeof url !== 'string') return false
    try {
      const parsed = new URL(url)
      return ['http:', 'https:'].includes(parsed.protocol)
    } catch (error) {
      return false
    }
  }

  const parseJSON = (value, fallback = null) => {
    if (typeof value !== 'string') return fallback
    try {
      return JSON.parse(value)
    } catch (error) {
      return fallback
    }
  }

  const toKebabCase = (value = '') => {
    if (typeof value !== 'string') return ''
    return value
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/\s+/g, '-')
      .toLowerCase()
  }

  const noop = () => {}

  const AppUtils = {
    selectElement,
    selectAllElements,
    createElement,
    addClass,
    removeClass,
    toggleClass,
    hasClass,
    addEvent,
    removeEvent,
    delegateEvent,
    debounce,
    throttle,
    truncateText,
    capitalizeFirst,
    toTitleCase,
    slugify,
    formatNumber,
    randomInt,
    clamp,
    shuffleArray,
    uniqueArray,
    isEmpty,
    deepClone,
    isValidEmail,
    isValidPhone,
    isValidURL,
    parseJSON,
    toKebabCase,
    noop
  }

  global.AppUtils = AppUtils
})(window)
