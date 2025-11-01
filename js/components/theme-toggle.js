;(function (global) {
  const THEME_LIGHT = 'light'
  const THEME_DARK = 'dark'
  const STORAGE_KEY = 'urza-theme'

  const Storage = global.StorageUtil || null
  const Utils = global.AppUtils || {}
  const selectAllElements =
    Utils.selectAllElements || ((selector, scope = document) => Array.from(scope.querySelectorAll(selector)))

  const root = document.documentElement
  const transitionDuration =
    (global.CONFIG && global.CONFIG.uiConfig && global.CONFIG.uiConfig.animationDuration) || 250

  let mediaQuery
  let transitionTimer
  let userHasExplicitPreference = false

  const getStoredTheme = () => {
    if (Storage && typeof Storage.getItem === 'function') {
      return Storage.getItem(STORAGE_KEY)
    }
    try {
      return window.localStorage.getItem(STORAGE_KEY)
    } catch (error) {
      return null
    }
  }

  const setStoredTheme = (theme) => {
    if (!theme) return
    if (Storage && typeof Storage.setItem === 'function') {
      Storage.setItem(STORAGE_KEY, theme)
      return
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch (error) {
      /* storage unavailable */
    }
  }

  const clearTransition = () => {
    if (transitionTimer) {
      window.clearTimeout(transitionTimer)
      transitionTimer = null
    }
    root.classList.remove('theme-transition')
  }

  const withTransition = (callback) => {
    if (typeof callback !== 'function') return
    clearTransition()
    root.classList.add('theme-transition')
    callback()
    transitionTimer = window.setTimeout(clearTransition, transitionDuration)
  }

  const updateToggleButtons = (theme) => {
    const buttons = selectAllElements('[data-theme-toggle]')
    if (!buttons.length) return
    const nextTheme = theme === THEME_DARK ? THEME_LIGHT : THEME_DARK
    buttons.forEach((button) => {
      button.setAttribute('aria-label', `Switch to ${nextTheme} theme`)
      button.setAttribute('title', `Switch to ${nextTheme} theme`)
      button.dataset.themeState = theme
      if (button.classList) {
        button.classList.toggle('is-dark', theme === THEME_DARK)
        button.classList.toggle('is-light', theme === THEME_LIGHT)
      }
      const icon = button.querySelector('[data-theme-icon]')
      if (icon) {
        icon.textContent = theme === THEME_DARK ? '🌙' : '☀️'
      }
    })
  }

  const applyTheme = (theme, { savePreference = true, withAnim = false } = {}) => {
    const nextTheme = theme === THEME_DARK ? THEME_DARK : THEME_LIGHT
    const apply = () => {
      root.dataset.theme = nextTheme
      root.classList.toggle('dark-mode', nextTheme === THEME_DARK)
      updateToggleButtons(nextTheme)
    }

    if (withAnim) {
      withTransition(apply)
    } else {
      apply()
    }

    if (savePreference) {
      setStoredTheme(nextTheme)
    }

    return nextTheme
  }

  const getCurrentTheme = () => {
    const storedTheme = getStoredTheme()
    if (storedTheme === THEME_LIGHT || storedTheme === THEME_DARK) {
      userHasExplicitPreference = true
      return storedTheme
    }

    if (!mediaQuery && window.matchMedia) {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    }

    if (mediaQuery && typeof mediaQuery.matches === 'boolean') {
      return mediaQuery.matches ? THEME_DARK : THEME_LIGHT
    }

    return THEME_LIGHT
  }

  const toggleTheme = () => {
    const currentTheme = root.classList.contains('dark-mode') ? THEME_DARK : THEME_LIGHT
    const nextTheme = currentTheme === THEME_DARK ? THEME_LIGHT : THEME_DARK
    userHasExplicitPreference = true
    applyTheme(nextTheme, { savePreference: true, withAnim: true })
  }

  const handleSystemThemeChange = (event) => {
    if (userHasExplicitPreference) return
    const prefersDark = event.matches
    applyTheme(prefersDark ? THEME_DARK : THEME_LIGHT, { savePreference: false })
  }

  const bindToggleButtons = () => {
    const buttons = selectAllElements('[data-theme-toggle]')
    buttons.forEach((button) => {
      button.removeEventListener('click', toggleTheme)
      button.addEventListener('click', toggleTheme)
    })
  }

  const initThemeToggle = () => {
    if (!mediaQuery && window.matchMedia) {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    }

    const initialTheme = getCurrentTheme()
    applyTheme(initialTheme, { savePreference: userHasExplicitPreference, withAnim: false })
    bindToggleButtons()

    if (mediaQuery && typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleSystemThemeChange)
    } else if (mediaQuery && typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleSystemThemeChange)
    }
  }

  global.ThemeToggle = {
    initThemeToggle,
    applyTheme
  }

  initThemeToggle()
})(window)
