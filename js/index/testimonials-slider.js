;(function (global) {
  const Utils = global.AppUtils || {}
  const selectElement = Utils.selectElement || ((selector, scope = document) => scope.querySelector(selector))
  const selectAllElements = Utils.selectAllElements || ((selector, scope = document) => Array.from(scope.querySelectorAll(selector)))

  const createIndicators = (count, container) => {
    container.innerHTML = ''
    return Array.from({ length: count }, (_, index) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.dataset.slide = String(index)
      if (index === 0) button.classList.add('is-active')
      container.appendChild(button)
      return button
    })
  }

  const setActiveSlide = (slides, indicators, index) => {
    slides.forEach((slide, idx) => {
      if (idx === index) {
        slide.classList.add('is-active')
      } else {
        slide.classList.remove('is-active')
        slide.classList.remove('is-highlighted')
      }
    })

    indicators.forEach((indicator, idx) => {
      if (idx === index) {
        indicator.classList.add('is-active')
      } else {
        indicator.classList.remove('is-active')
      }
    })
  }

  let initialized = false

  const initSlider = () => {
    if (initialized) return
    initialized = true
    const carousel = selectElement('[data-testimonials]')
    if (!carousel) return

    const slides = selectAllElements('.testimonial-card', carousel)
    const prevBtn = selectElement('[data-testimonial-prev]', carousel)
    const nextBtn = selectElement('[data-testimonial-next]', carousel)
    const indicatorsContainer = selectElement('[data-testimonial-indicators]', carousel)
    if (!slides.length || !prevBtn || !nextBtn || !indicatorsContainer) return

    let currentIndex = 0
    let autoRotationId = null

    const indicators = createIndicators(slides.length, indicatorsContainer)

    const goToSlide = (index) => {
      currentIndex = (index + slides.length) % slides.length
      setActiveSlide(slides, indicators, currentIndex)
    }

    const nextSlide = () => goToSlide(currentIndex + 1)
    const prevSlide = () => goToSlide(currentIndex - 1)

    const startAutoRotation = () => {
      clearInterval(autoRotationId)
      autoRotationId = setInterval(nextSlide, 7000)
    }

    const stopAutoRotation = () => {
      clearInterval(autoRotationId)
    }

    prevBtn.addEventListener('click', () => {
      prevSlide()
      startAutoRotation()
    })

    nextBtn.addEventListener('click', () => {
      nextSlide()
      startAutoRotation()
    })

    indicators.forEach((indicator, idx) => {
      indicator.addEventListener('click', () => {
        goToSlide(idx)
        startAutoRotation()
      })
    })

    carousel.addEventListener('mouseenter', stopAutoRotation)
    carousel.addEventListener('mouseleave', startAutoRotation)

    // Touch support
    let startX = 0
    let isDragging = false

    carousel.addEventListener('touchstart', (event) => {
      if (!event.touches || event.touches.length !== 1) return
      startX = event.touches[0].clientX
      isDragging = true
      stopAutoRotation()
    })

    carousel.addEventListener('touchmove', (event) => {
      if (!isDragging || !event.touches || event.touches.length !== 1) return
      const deltaX = event.touches[0].clientX - startX
      if (Math.abs(deltaX) > 40) {
        if (deltaX > 0) {
          prevSlide()
        } else {
          nextSlide()
        }
        isDragging = false
      }
    })

    carousel.addEventListener('touchend', () => {
      isDragging = false
      startAutoRotation()
    })

    startAutoRotation()
  }

  global.TestimonialsSlider = {
    initSlider
  }
})(window)
