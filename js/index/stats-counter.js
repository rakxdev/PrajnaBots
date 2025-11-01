;(function (global) {
  const Utils = global.AppUtils || {}
  const selectAllElements = Utils.selectAllElements || ((selector, scope = document) => Array.from(scope.querySelectorAll(selector)))
  const clamp = Utils.clamp || ((value, min, max) => Math.min(Math.max(value, min), max))

  const COUNTER_DURATION = 1800
  const COUNTER_EASING = (t) => 1 - Math.pow(1 - t, 4)

  const formatValue = (value, target) => {
    const text = target.textContent.trim()
    if (text.includes('%')) return `${value.toFixed(0)}%`
    if (text.includes('+')) return `${value.toFixed(0)}+`
    if (/₹/.test(text)) {
      return `₹${value.toFixed(0)}${text.endsWith('+') ? '+' : ''}`
    }
    if (text.includes('Cr')) return `${value.toFixed(0)} Cr`
    return value.toFixed(0)
  }

  const animateCounter = (element) => {
    const targetValue = Number(element.dataset.counterTarget)
    if (Number.isNaN(targetValue)) return
    const startValue = 0
    let startTime

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = clamp((timestamp - startTime) / COUNTER_DURATION, 0, 1)
      const eased = COUNTER_EASING(progress)
      const currentValue = startValue + (targetValue - startValue) * eased
      element.textContent = formatValue(currentValue, element)
      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }

    window.requestAnimationFrame(step)
  }

  const initCounters = () => {
    const counterElements = selectAllElements('[data-counter-target]')
    if (!counterElements.length) return
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target)
            obs.unobserve(entry.target)
          }
        })
      },
      {
        rootMargin: '0px 0px -20% 0px',
        threshold: 0.2
      }
    )

    counterElements.forEach((el) => observer.observe(el))
  }

  const initROIForm = () => {
    const form = document.querySelector('[data-roi-form]')
    const results = document.querySelector('[data-roi-results]')
    if (!form || !results) return

    const energyOutput = results.querySelector('[data-roi-energy]')
    const revenueOutput = results.querySelector('[data-roi-revenue]')
    const waterOutput = results.querySelector('[data-roi-water]')
    const totalOutput = results.querySelector('[data-roi-total]')

    const regionalFactors = {
      north: { lossRate: 0.32, waterSavings: 0.55 },
      west: { lossRate: 0.38, waterSavings: 0.6 },
      south: { lossRate: 0.24, waterSavings: 0.5 },
      east: { lossRate: 0.26, waterSavings: 0.52 }
    }

    const formatCurrency = (value) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

    form.addEventListener('submit', (event) => {
      event.preventDefault()
      const formData = new FormData(form)
      const installationSize = Number(formData.get('installationSize') || 0)
      const energyRate = Number(formData.get('energyRate') || 0)
      const panelCount = Number(formData.get('panelCount') || 0)
      const region = formData.get('region') || 'north'
      const factors = regionalFactors[region]
      if (!installationSize || !energyRate || !panelCount || !factors) return

      const baseLossPerYear = installationSize * 4.5 * 365 * factors.lossRate
      const energyLossAvoided = baseLossPerYear
      const revenueLossPrevented = energyLossAvoided * energyRate
      const waterSaved = panelCount * 120 * factors.waterSavings
      const projectedROI = revenueLossPrevented * 0.28 + waterSaved * 0.4

      energyOutput.textContent = `${energyLossAvoided.toLocaleString('en-IN', { maximumFractionDigits: 0 })} kWh`
      revenueOutput.textContent = formatCurrency(revenueLossPrevented)
      waterOutput.textContent = `${waterSaved.toLocaleString('en-IN', { maximumFractionDigits: 0 })} L`
      totalOutput.textContent = formatCurrency(projectedROI)

      results.classList.add('show')
    })
  }

  let initialized = false

  const initStats = () => {
    if (initialized) return
    initialized = true
    initCounters()
    initROIForm()
  }

  global.IndexStats = {
    initStats
  }
})(window)
