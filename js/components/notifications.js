;(function (global) {
  const Utils = global.AppUtils || {}
  const createElement =
    Utils.createElement || ((tag, className = '') => Object.assign(document.createElement(tag), { className }))

  const TYPE_SUCCESS = 'success'
  const TYPE_ERROR = 'error'
  const TYPE_WARNING = 'warning'
  const TYPE_INFO = 'info'

  const containerClass = 'notification-container'
  const notificationClass = 'notification'

  const animationDuration =
    (global.CONFIG && global.CONFIG.uiConfig && global.CONFIG.uiConfig.animationDuration) || 250

  const notificationTimers = new WeakMap()

  const ensureContainer = () => {
    let container = document.querySelector(`.${containerClass}`)
    if (container) return container
    container = createElement('div', containerClass)
    container.setAttribute('role', 'region')
    container.setAttribute('aria-live', 'polite')
    container.setAttribute('aria-label', 'Notifications')
    document.body.appendChild(container)
    return container
  }

  const getIconSymbol = (type) => {
    switch (type) {
      case TYPE_SUCCESS:
        return '✔'
      case TYPE_ERROR:
        return '⛔'
      case TYPE_WARNING:
        return '⚠'
      default:
        return 'ℹ'
    }
  }

  const addProgressBar = (notificationElement, duration) => {
    if (duration <= 0) return null
    const progress = createElement('div', `${notificationClass}__progress`)
    progress.style.width = '100%'
    notificationElement.appendChild(progress)
    return progress
  }

  const createNotificationElement = (message, type, duration) => {
    const safeType = [TYPE_SUCCESS, TYPE_ERROR, TYPE_WARNING, TYPE_INFO].includes(type) ? type : TYPE_INFO
    const notification = createElement('div', `${notificationClass} ${notificationClass}--${safeType}`)
    notification.setAttribute('role', 'alert')
    notification.setAttribute('aria-live', 'polite')
    notification.dataset.type = safeType

    const icon = createElement('span', `${notificationClass}__icon`)
    icon.setAttribute('aria-hidden', 'true')
    icon.textContent = getIconSymbol(safeType)

    const messageEl = createElement('p', `${notificationClass}__message`)
    messageEl.textContent = message

    const closeButton = createElement('button', `${notificationClass}__close`)
    closeButton.type = 'button'
    closeButton.setAttribute('aria-label', 'Dismiss notification')
    closeButton.innerHTML = '&times;'

    const content = createElement('div', `${notificationClass}__content`)
    content.appendChild(icon)
    content.appendChild(messageEl)

    notification.appendChild(content)
    notification.appendChild(closeButton)

    const progressBar = addProgressBar(notification, duration)

    return { notification, closeButton, progressBar }
  }

  const cleanupTimer = (notificationElement) => {
    const record = notificationTimers.get(notificationElement)
    if (!record) return
    window.clearTimeout(record.timerId)
    notificationTimers.delete(notificationElement)
  }

  const hideNotification = (notificationElement) => {
    if (!notificationElement || notificationElement.dataset.closing === 'true') return
    notificationElement.dataset.closing = 'true'
    cleanupTimer(notificationElement)

    notificationElement.classList.add(`${notificationClass}--leaving`)
    window.setTimeout(() => {
      if (notificationElement.parentElement) {
        notificationElement.parentElement.removeChild(notificationElement)
      }
    }, animationDuration)
  }

  const setupAutoDismiss = (notificationElement, duration) => {
    if (duration <= 0) return null

    const progressRecord = {
      duration,
      remaining: duration,
      start: Date.now(),
      timerId: null,
      progressBar: notificationElement.querySelector(`.${notificationClass}__progress`)
    }

    const startTimer = () => {
      progressRecord.start = Date.now()
      progressRecord.timerId = window.setTimeout(() => hideNotification(notificationElement), progressRecord.remaining)
      if (progressRecord.progressBar) {
        progressRecord.progressBar.style.transition = `width ${progressRecord.remaining}ms linear`
        // Force reflow before starting transition
        void progressRecord.progressBar.offsetWidth
        progressRecord.progressBar.style.width = '0%'
      }
    }

    const pauseTimer = () => {
      window.clearTimeout(progressRecord.timerId)
      const elapsed = Date.now() - progressRecord.start
      progressRecord.remaining = Math.max(0, progressRecord.remaining - elapsed)
      progressRecord.timerId = null
      if (progressRecord.progressBar) {
        const remainingRatio = progressRecord.remaining / progressRecord.duration
        progressRecord.progressBar.style.transition = 'none'
        progressRecord.progressBar.style.width = `${remainingRatio * 100}%`
      }
    }

    const resumeTimer = () => {
      if (progressRecord.remaining <= 0) {
        hideNotification(notificationElement)
        return
      }
      if (progressRecord.progressBar) {
        progressRecord.progressBar.style.transition = 'none'
        progressRecord.progressBar.style.width = '100%'
      }
      startTimer()
    }

    startTimer()

    progressRecord.pause = pauseTimer
    progressRecord.resume = resumeTimer

    notificationTimers.set(notificationElement, progressRecord)
    return progressRecord
  }

  const setupCloseButton = (notificationElement, closeButton) => {
    if (!closeButton) return
    closeButton.addEventListener('click', () => hideNotification(notificationElement))
  }

  const setupHoverPause = (notificationElement, timerRecord) => {
    if (!timerRecord) return
    notificationElement.addEventListener('mouseenter', timerRecord.pause)
    notificationElement.addEventListener('mouseleave', timerRecord.resume)
  }

  const showNotification = (message, type = TYPE_INFO, duration = 3000) => {
    const container = ensureContainer()
    const { notification, closeButton } = createNotificationElement(message, type, duration)
    container.appendChild(notification)

    window.requestAnimationFrame(() => {
      notification.classList.add(`${notificationClass}--visible`)
    })

    const timerRecord = setupAutoDismiss(notification, duration)
    setupCloseButton(notification, closeButton)
    setupHoverPause(notification, timerRecord)

    return notification
  }

  const showSuccess = (message, duration) => showNotification(message, TYPE_SUCCESS, duration)
  const showError = (message, duration) => showNotification(message, TYPE_ERROR, duration)
  const showWarning = (message, duration) => showNotification(message, TYPE_WARNING, duration)
  const showInfo = (message, duration) => showNotification(message, TYPE_INFO, duration)

  const clearAllNotifications = () => {
    const container = document.querySelector(`.${containerClass}`)
    if (!container) return
    Array.from(container.children).forEach((child) => hideNotification(child))
  }

  const initNotifications = () => {
    ensureContainer()
  }

  global.Notifications = {
    initNotifications,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAllNotifications
  }

  document.addEventListener('DOMContentLoaded', initNotifications)
})(window)
