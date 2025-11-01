;(function (global) {
  const Utils = global.AppUtils || {}
  const selectElement = Utils.selectElement || ((selector, scope = document) => scope.querySelector(selector))
  const selectAllElements = Utils.selectAllElements || ((selector, scope = document) => Array.from(scope.querySelectorAll(selector)))
  const clampValue = Utils.clamp || ((value, min, max) => Math.min(Math.max(value, min), max))
  const debounce = Utils.debounce || ((fn, wait = 16) => {
    let timeoutId
    return (...args) => {
      window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => fn.apply(null, args), wait)
    }
  })

  let initialized = false

  const callIfFunction = (fn) => (typeof fn === 'function' ? fn : null)

  const initComparisonSlider = () => {
    const wrapper = selectElement('[data-comparison]')
    if (!wrapper) return false

    const beforeImage = wrapper.querySelector('.comparison-image--before')
    const afterImage = wrapper.querySelector('.comparison-image--after')
    const slider = wrapper.querySelector('.comparison-slider')
    const handle = wrapper.querySelector('.comparison-handle')
    if (!beforeImage || !afterImage || !slider) return false

    let currentPercent = 50
    let isPointerActive = false

    const setPosition = (percent) => {
      const constrained = clampValue(percent, 0, 100)
      currentPercent = constrained
      const beforeClip = 100 - constrained
      beforeImage.style.clipPath = `inset(0 ${beforeClip}% 0 0)`
      afterImage.style.clipPath = `inset(0 0 0 ${constrained}%)`
      slider.style.left = `${constrained}%`
      if (handle) {
        handle.style.left = `${constrained}%`
      }
    }

    const updateFromClientX = (clientX) => {
      if (typeof clientX !== 'number') return
      const rect = wrapper.getBoundingClientRect()
      if (!rect.width) return
      const x = clampValue(clientX - rect.left, 0, rect.width)
      const percent = (x / rect.width) * 100
      setPosition(percent)
    }

    const onPointerDown = (event) => {
      if (typeof event.preventDefault === 'function') {
        event.preventDefault()
      }
      isPointerActive = true
      wrapper.classList.add('is-dragging')
      updateFromClientX(event.clientX)
      if (wrapper.setPointerCapture && typeof event.pointerId === 'number') {
        try {
          wrapper.setPointerCapture(event.pointerId)
        } catch (error) {
          // ignore capture errors
        }
      }
    }

    const onPointerMove = (event) => {
      if (!isPointerActive) return
      if (typeof event.preventDefault === 'function') {
        event.preventDefault()
      }
      updateFromClientX(event.clientX)
    }

    const onPointerUp = (event) => {
      if (!isPointerActive) return
      isPointerActive = false
      wrapper.classList.remove('is-dragging')
      if (wrapper.releasePointerCapture && typeof event.pointerId === 'number') {
        try {
          wrapper.releasePointerCapture(event.pointerId)
        } catch (error) {
          // ignore release errors
        }
      }
    }

    const onMouseDown = (event) => {
      event.preventDefault()
      isPointerActive = true
      wrapper.classList.add('is-dragging')
      updateFromClientX(event.clientX)
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    }

    const onMouseMove = (event) => {
      if (!isPointerActive) return
      updateFromClientX(event.clientX)
    }

    const onMouseUp = () => {
      if (!isPointerActive) return
      isPointerActive = false
      wrapper.classList.remove('is-dragging')
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    const onTouchStart = (event) => {
      if (!event.touches || !event.touches.length) return
      if (typeof event.preventDefault === 'function') {
        event.preventDefault()
      }
      isPointerActive = true
      wrapper.classList.add('is-dragging')
      updateFromClientX(event.touches[0].clientX)
      document.addEventListener('touchmove', onTouchMove)
      document.addEventListener('touchend', onTouchEnd)
      document.addEventListener('touchcancel', onTouchEnd)
    }

    const onTouchMove = (event) => {
      if (!isPointerActive || !event.touches || !event.touches.length) return
      if (typeof event.preventDefault === 'function') {
        event.preventDefault()
      }
      updateFromClientX(event.touches[0].clientX)
    }

    const onTouchEnd = () => {
      if (!isPointerActive) return
      isPointerActive = false
      wrapper.classList.remove('is-dragging')
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
      document.removeEventListener('touchcancel', onTouchEnd)
    }

    const onKeyDown = (event) => {
      const step = event.shiftKey ? 10 : 5
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setPosition(currentPercent - step)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        setPosition(currentPercent + step)
      }
    }

    if (window.PointerEvent) {
      wrapper.addEventListener('pointerdown', onPointerDown)
      wrapper.addEventListener('pointermove', onPointerMove)
      wrapper.addEventListener('pointerup', onPointerUp)
      wrapper.addEventListener('pointerleave', onPointerUp)
      wrapper.addEventListener('pointercancel', onPointerUp)
    } else {
      wrapper.addEventListener('mousedown', onMouseDown)
      wrapper.addEventListener('touchstart', onTouchStart, { passive: false })
    }

    wrapper.addEventListener('keydown', onKeyDown)
    setPosition(currentPercent)
    return true
  }

  const initFeaturesTabs = () => {
    const tabsRoot = selectElement('[data-tabs]')
    if (!tabsRoot) return false

    const tabButtons = selectAllElements('.tab-button', tabsRoot)
    const tabPanels = selectAllElements('[role="tabpanel"]', tabsRoot)
    if (!tabButtons.length || !tabPanels.length) return false

    let activeIndex = tabButtons.findIndex((btn) => btn.classList.contains('active'))
    if (activeIndex < 0) activeIndex = 0

    const activateTab = (index) => {
      const boundedIndex = clampValue(index, 0, tabButtons.length - 1)
      activeIndex = boundedIndex
      tabButtons.forEach((button, idx) => {
        const isActive = idx === boundedIndex
        button.classList.toggle('active', isActive)
        button.setAttribute('aria-selected', isActive ? 'true' : 'false')
        button.setAttribute('tabindex', isActive ? '0' : '-1')
      })

      tabPanels.forEach((panel) => {
        const controls = panel.getAttribute('aria-labelledby')
        const button = controls ? document.getElementById(controls) : null
        const isMatch = button ? button.classList.contains('active') : false
        panel.classList.toggle('active', isMatch)
        panel.hidden = !isMatch
      })
    }

    tabButtons.forEach((button, index) => {
      button.addEventListener('click', () => {
        activateTab(index)
      })

      button.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          event.preventDefault()
          const nextIndex = (index + 1) % tabButtons.length
          activateTab(nextIndex)
          tabButtons[nextIndex].focus()
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          event.preventDefault()
          const prevIndex = (index - 1 + tabButtons.length) % tabButtons.length
          activateTab(prevIndex)
          tabButtons[prevIndex].focus()
        } else if (event.key === 'Home') {
          event.preventDefault()
          activateTab(0)
          tabButtons[0].focus()
        } else if (event.key === 'End') {
          event.preventDefault()
          const lastIdx = tabButtons.length - 1
          activateTab(lastIdx)
          tabButtons[lastIdx].focus()
        }
      })
    })

    activateTab(activeIndex)
    return true
  }

  const initSolutionCTA = () => {
    const ctaButton = selectElement('.solution-actions .btn')
    const roiSection = selectElement('.roi-calculator')
    if (!ctaButton || !roiSection) return false

    const focusTarget = roiSection.querySelector('input, select, textarea, button')

    ctaButton.addEventListener('click', (event) => {
      event.preventDefault()
      const smoothScrollFn = global.SmoothScroll && callIfFunction(global.SmoothScroll.smoothScrollTo)
      if (smoothScrollFn) {
        const { top } = roiSection.getBoundingClientRect()
        const targetPosition = top + window.pageYOffset - 80
        smoothScrollFn(targetPosition, 900, () => {
          if (focusTarget && typeof focusTarget.focus === 'function') {
            focusTarget.focus({ preventScroll: true })
          }
        })
      } else {
        roiSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
        window.setTimeout(() => {
          if (focusTarget && typeof focusTarget.focus === 'function') {
            focusTarget.focus({ preventScroll: true })
          }
        }, 600)
      }
    })

    return true
  }

  const initTrustedCardHover = () => {
    const cards = selectAllElements('.testimonial-card')
    if (!cards.length) return false

    const handleHover = (card) => {
      cards.forEach((item) => {
        item.classList.toggle('is-highlighted', item === card)
      })
    }

    cards.forEach((card) => {
      card.addEventListener('mouseenter', () => handleHover(card))
      card.addEventListener('mouseleave', () => handleHover(null))
      card.addEventListener('focusin', () => handleHover(card))
      card.addEventListener('focusout', debounce(() => handleHover(null), 100))
    })

    return true
  }

  const initModules = () => {
    if (global.HeroAnimations && callIfFunction(global.HeroAnimations.initHeroAnimations)) {
      global.HeroAnimations.initHeroAnimations()
    }
    if (global.IndexStats && callIfFunction(global.IndexStats.initStats)) {
      global.IndexStats.initStats()
    }
    if (global.TestimonialsSlider && callIfFunction(global.TestimonialsSlider.initSlider)) {
      global.TestimonialsSlider.initSlider()
    }
  }

  const init = () => {
    if (initialized) return
    initialized = true

    initModules()
    initComparisonSlider()
    initFeaturesTabs()
    initSolutionCTA()
    initTrustedCardHover()
  }

  document.addEventListener('DOMContentLoaded', init)
})(window)
