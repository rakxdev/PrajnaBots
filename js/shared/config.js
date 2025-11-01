;(function (global) {
  const CONFIG = Object.freeze({
    appName: 'Urza',
    version: '1.0.0',
    apiBaseURL: '/api',
    environment: 'development',
    featureFlags: {
      enableThemeToggle: true,
      enableSearch: true,
      enableNotifications: true,
      enableAnalytics: false
    },
    uiConfig: {
      animationDuration: 250,
      debounceDelay: 300,
      toastDuration: 3000,
      modalTransitionTime: 150
    },
    routes: {
      home: '/index.html',
      login: '/login.html',
      register: '/register.html',
      dashboard: '/dashboard.html',
      features: '/features.html',
      pricing: '/pricing.html',
      about: '/about.html',
      contact: '/contact.html',
      caseStudies: '/case-studies.html'
    }
  })

  global.CONFIG = CONFIG
})(window)
