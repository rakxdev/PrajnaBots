;(function (global) {
  const DEFAULT_DURATION = 800

  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

  const getTargetElement = (hash) => {
    if (!hash || typeof hash !== 'string' || hash === '#') return null
    try {
      const id = hash.startsWith('#') ? hash : `#${hash}`
      return document.querySelector(id)
    } catch (error) {
      return null
    }
  }

  const getOffset = (element) => {
    if (!element) return 0
    const offsetAttr = element.getAttribute('data-scroll-offset')
    if (offsetAttr) {
      const parsed = parseInt(offsetAttr, 10)
      if (!Number.isNaN(parsed)) return parsed
    }
    const navbar = document.querySelector('.navbar')
    return navbar ? navbar.offsetHeight + 16 : 80
  }

  const getTargetPosition = (element, offset) => {
    const rect = element.getBoundingClientRect()
    return rect.top + window.pageYOffset - offset
  }

  const smoothScrollTo = (targetPosition, duration = DEFAULT_DURATION, callback) => {
    const start = window.pageYOffset
    const distance = targetPosition - start
    if (Math.abs(distance) < 1 || duration <= 0) {
      window.scrollTo(0, targetPosition)
      if (typeof callback === 'function') callback()
      return
    }

    let startTime = null

    const step = (currentTime) => {
      if (startTime === null) startTime = currentTime
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeInOutCubic(progress)
      window.scrollTo(0, start + distance * eased)
      if (progress < 1) {
        window.requestAnimationFrame(step)
      } else if (typeof callback === 'function') {
        callback()
      }
    }

    window.requestAnimationFrame(step)
  }

  const handleAnchorClick = (event) => {
    const link = event.currentTarget
    const href = link.getAttribute('href') || ''
    if (!href.startsWith('#')) return
    const target = getTargetElement(href)
    if (!target) return
    event.preventDefault()
    const offset = getOffset(link)
    const position = getTargetPosition(target, offset)
    smoothScrollTo(position, DEFAULT_DURATION, () => {
      if (history.pushState) {
        history.pushState(null, '', href)
      } else {
        window.location.hash = href
      }
    })
  }

  const setupSmoothScroll = () => {
    const anchors = document.querySelectorAll('a[href^="#"]')
    anchors.forEach((anchor) => {
      const href = anchor.getAttribute('href') || ''
      if (href === '#' || anchor.dataset.scrollIgnore === 'true') return
      anchor.addEventListener('click', handleAnchorClick)
    })
  }

  const scrollToHashOnLoad = () => {
    if (!window.location.hash) return
    const target = getTargetElement(window.location.hash)
    if (!target) return
    window.setTimeout(() => {
      const offset = getOffset(target)
      const position = getTargetPosition(target, offset)
      smoothScrollTo(position)
    }, 50)
  }

  const handleHashChange = () => {
    const target = getTargetElement(window.location.hash)
    if (!target) return
    const offset = getOffset(target)
    const position = getTargetPosition(target, offset)
    smoothScrollTo(position)
  }

  const initSmoothScroll = () => {
    setupSmoothScroll()
    scrollToHashOnLoad()
    window.addEventListener('hashchange', handleHashChange)
  }

  global.SmoothScroll = {
    smoothScrollTo,
    initSmoothScroll
  }

  document.addEventListener('DOMContentLoaded', initSmoothScroll)
})(window)
