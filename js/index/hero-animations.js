;(function (global) {
  const Utils = global.AppUtils || {}
  const selectElement = Utils.selectElement || ((selector, scope = document) => scope.querySelector(selector))
  const selectAllElements = Utils.selectAllElements || ((selector, scope = document) => Array.from(scope.querySelectorAll(selector)))
  const clamp = Utils.clamp || ((value, min, max) => Math.min(Math.max(value, min), max))

  const PARTICLE_COUNT = 28
  const PARTICLE_COLORS = ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.26)', 'rgba(6,182,212,0.25)']

  const createParticle = (container) => {
    const particle = document.createElement('span')
    particle.className = 'hero-particle'
    const size = Math.random() * 6 + 4
    const startX = Math.random() * 100
    const delay = Math.random() * 6
    const duration = Math.random() * 10 + 10
    particle.style.width = `${size}px`
    particle.style.height = `${size}px`
    particle.style.left = `${startX}%`
    particle.style.animationDelay = `${delay}s`
    particle.style.animationDuration = `${duration}s`
    particle.style.background = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]
    container.appendChild(particle)
  }

  const setupParticles = () => {
    const container = selectElement('.hero-particles')
    if (!container) return
    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      createParticle(container)
    }
  }

  const animateHeroOnScroll = () => {
    const hero = selectElement('.hero-section')
    const heroVisual = selectElement('.hero-visual__media')
    const heroContent = selectElement('.hero-content')
    if (!hero || !heroVisual || !heroContent) return

    const maxTranslate = 18
    const onScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset
      const heroHeight = hero.offsetHeight
      const progress = clamp(scrollY / heroHeight, 0, 1)
      const translateY = progress * maxTranslate
      heroVisual.style.transform = `translateY(${translateY}px)`
      heroVisual.style.opacity = String(1 - progress * 0.35)
      heroContent.style.transform = `translateY(${translateY * 0.3}px)`
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
  }

  const floatBadges = () => {
    const badges = selectAllElements('.hero-badge')
    if (!badges.length) return
    badges.forEach((badge, index) => {
      const animationDelay = (index % 3) * 0.25
      badge.style.animation = `badgeFloat ${6 + index % 4}s ease-in-out ${animationDelay}s infinite alternate`
    })
  }

  const registerAnimations = () => {
    const styleTag = document.createElement('style')
    styleTag.textContent = `
      @keyframes particleFloat {
        0% {
          transform: translateY(0) translateX(0);
          opacity: 0;
        }
        20% {
          opacity: 1;
        }
        100% {
          transform: translateY(-180px) translateX(40px);
          opacity: 0;
        }
      }

      .hero-particle {
        position: absolute;
        bottom: -40px;
        border-radius: 50%;
        animation: particleFloat linear infinite;
        pointer-events: none;
      }

      @keyframes badgeFloat {
        from {
          transform: translateY(0px) scale(1);
        }
        to {
          transform: translateY(-8px) scale(1.005);
        }
      }
    `
    document.head.appendChild(styleTag)
  }

  let initialized = false

  const initHeroAnimations = () => {
    if (initialized) return
    initialized = true
    registerAnimations()
    setupParticles()
    animateHeroOnScroll()
    floatBadges()
  }

  global.HeroAnimations = {
    initHeroAnimations
  }
})(window)
