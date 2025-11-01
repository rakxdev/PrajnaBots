;(function (global) {
  const Utils = global.AppUtils || {}
  const selectElement = Utils.selectElement || ((selector, scope = document) => scope.querySelector(selector))
  const selectAllElements =
    Utils.selectAllElements || ((selector, scope = document) => Array.from(scope.querySelectorAll(selector)))

  const focusableSelector =
    'a[href], button:not([disabled]), textarea, input:not([type="hidden"]), select, details,[tabindex]:not([tabindex="-1"])'

  let activeModalId = null
  let activeModalElements = null
  let previouslyFocusedElement = null
  let focusTrapBinding = null
  let escapeListenerBound = false

  const getModalElements = (modalId) => {
    if (!modalId) return null
    const modal =
      selectElement(`[data-modal="${modalId}"]`) || selectElement(`#${modalId}`) || selectElement(`[data-modal-id="${modalId}"]`)

    if (!modal) return null

    let overlay =
      modal.closest('.modal-overlay') ||
      selectElement(`[data-modal-overlay="${modalId}"]`) ||
      selectElement(`#${modalId}-overlay`)

    if (!overlay) {
      overlay = modal.parentElement && modal.parentElement.classList.contains('modal-overlay') ? modal.parentElement : null
    }

    const closeButtons = selectAllElements('[data-modal-close]', modal)

    return {
      modal,
      overlay,
      closeButtons
    }
  }

  const getFocusableElements = (container) => {
    if (!container) return []
    return selectAllElements(focusableSelector, container).filter((el) => !el.hasAttribute('disabled') && el.getAttribute('tabindex') !== '-1')
  }

  const trapFocus = (modal) => {
    const focusable = getFocusableElements(modal)
    if (!focusable.length) {
      modal.setAttribute('tabindex', '-1')
      focusable.push(modal)
    }
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    const handleKeydown = (event) => {
      if (event.key !== 'Tab') return
      if (focusable.length === 1) {
        event.preventDefault()
        first.focus()
        return
      }
      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault()
          last.focus()
        }
      } else if (document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    modal.addEventListener('keydown', handleKeydown)
    focusTrapBinding = { element: modal, handler: handleKeydown }
  }

  const removeFocusTrap = () => {
    if (!focusTrapBinding) return
    const { element, handler } = focusTrapBinding
    element.removeEventListener('keydown', handler)
    if (element.getAttribute('tabindex') === '-1') {
      element.removeAttribute('tabindex')
    }
    focusTrapBinding = null
  }

  const lockBodyScroll = () => {
    document.body.dataset.modalOverflow = document.body.style.overflow || ''
    document.body.style.overflow = 'hidden'
  }

  const unlockBodyScroll = () => {
    const previous = document.body.dataset.modalOverflow
    document.body.style.overflow = previous || ''
    delete document.body.dataset.modalOverflow
  }

  const focusFirstElement = (modal) => {
    const focusable = getFocusableElements(modal)
    if (focusable.length) {
      focusable[0].focus({ preventScroll: true })
    } else {
      modal.focus({ preventScroll: true })
    }
  }

  const openModal = (modalId) => {
    if (activeModalId === modalId) return
    const elements = getModalElements(modalId)
    if (!elements) return

    const { modal, overlay } = elements
    previouslyFocusedElement = document.activeElement

    if (overlay) {
      overlay.classList.add('open')
      overlay.setAttribute('aria-hidden', 'false')
    }

    modal.classList.add('open')
    modal.setAttribute('aria-hidden', 'false')
    modal.setAttribute('aria-modal', 'true')
    lockBodyScroll()
    trapFocus(modal)
    focusFirstElement(modal)

    activeModalId = modalId
    activeModalElements = elements
  }

  const closeModal = (modalId) => {
    const targetId = modalId || activeModalId
    if (!targetId) return
    const elements = activeModalElements && activeModalId === targetId ? activeModalElements : getModalElements(targetId)
    if (!elements) return

    const { modal, overlay } = elements

    modal.classList.remove('open')
    modal.setAttribute('aria-hidden', 'true')
    modal.removeAttribute('aria-modal')
    if (overlay) {
      overlay.classList.remove('open')
      overlay.setAttribute('aria-hidden', 'true')
    }
    removeFocusTrap()
    unlockBodyScroll()

    if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function') {
      previouslyFocusedElement.focus({ preventScroll: true })
    }

    activeModalId = null
    activeModalElements = null
    previouslyFocusedElement = null
  }

  const handleOverlayClick = (event) => {
    if (!activeModalElements || !activeModalElements.overlay) return
    if (event.target !== activeModalElements.overlay) return
    closeModal()
  }

  const handleEscapeKey = (event) => {
    if (event.key === 'Escape') {
      closeModal()
    }
  }

  const handleTriggerClick = (event) => {
    const trigger = event.currentTarget
    const modalId = trigger.getAttribute('data-modal-open')
    if (!modalId) return
    event.preventDefault()
    openModal(modalId)
  }

  const handleCloseClick = (event) => {
    event.preventDefault()
    const button = event.currentTarget
    const modalId = button.getAttribute('data-modal-close') || (activeModalElements && activeModalId)
    closeModal(modalId)
  }

  const setupModalTriggers = () => {
    const openers = selectAllElements('[data-modal-open]')
    openers.forEach((trigger) => {
      trigger.removeEventListener('click', handleTriggerClick)
      trigger.addEventListener('click', handleTriggerClick)
    })

    const closers = selectAllElements('[data-modal-close]')
    closers.forEach((closer) => {
      closer.removeEventListener('click', handleCloseClick)
      closer.addEventListener('click', handleCloseClick)
    })
  }

  const bindOverlayListeners = () => {
    const overlays = selectAllElements('.modal-overlay')
    overlays.forEach((overlayElement) => {
      overlayElement.removeEventListener('click', handleOverlayClick)
      overlayElement.addEventListener('click', handleOverlayClick)
    })
  }

  const initModals = () => {
    setupModalTriggers()
    bindOverlayListeners()
    if (!escapeListenerBound) {
      document.addEventListener('keydown', handleEscapeKey)
      escapeListenerBound = true
    }
  }

  global.Modal = {
    initModals,
    openModal,
    closeModal
  }

  document.addEventListener('DOMContentLoaded', initModals)
})(window)
