;(function (global) {
  const makeResult = (valid, message, extra = {}) => ({ valid, message, ...extra })

  const validateEmail = (email) => {
    const value = typeof email === 'string' ? email.trim() : ''
    const pattern = /^[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(\.[\w-]+)+$/
    const valid = pattern.test(value)
    return makeResult(valid, valid ? 'Valid email' : 'Please enter a valid email address')
  }

  const evaluatePasswordStrength = (password = '') => {
    let score = 0
    if (password.length >= 8) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[a-z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1
    if (score >= 4) return 'strong'
    if (score >= 3) return 'medium'
    return 'weak'
  }

  const validatePassword = (password, minLength = 6) => {
    const value = typeof password === 'string' ? password : ''
    if (value.length < minLength) {
      return makeResult(false, `Password must be at least ${minLength} characters long`, {
        strength: 'weak'
      })
    }

    const requirements = [
      { check: /[A-Z]/.test(value), message: 'Include at least one uppercase letter' },
      { check: /[a-z]/.test(value), message: 'Include at least one lowercase letter' },
      { check: /[0-9]/.test(value), message: 'Include at least one number' }
    ]

    const missing = requirements.filter((req) => !req.check).map((req) => req.message)
    if (missing.length) {
      return makeResult(false, missing.join('. '), { strength: 'weak' })
    }

    const strength = evaluatePasswordStrength(value)
    return makeResult(true, 'Strong password', { strength })
  }

  const validatePasswordMatch = (password, confirmPassword) => {
    const valid = password === confirmPassword && Boolean(password)
    return makeResult(valid, valid ? 'Passwords match' : 'Passwords do not match')
  }

  const validateRequired = (value, fieldName = 'This field') => {
    const valid = value !== undefined && value !== null && String(value).trim().length > 0
    return makeResult(valid, valid ? 'Valid' : `${fieldName} is required`)
  }

  const validateMinLength = (value, minLength, fieldName = 'This field') => {
    const safeValue = typeof value === 'string' ? value.trim() : ''
    const valid = safeValue.length >= minLength
    return makeResult(valid, valid ? 'Valid' : `${fieldName} must be at least ${minLength} characters`)
  }

  const validateMaxLength = (value, maxLength, fieldName = 'This field') => {
    const safeValue = typeof value === 'string' ? value.trim() : ''
    const valid = safeValue.length <= maxLength
    return makeResult(valid, valid ? 'Valid' : `${fieldName} must not exceed ${maxLength} characters`)
  }

  const validatePhone = (phone) => {
    const digits = String(phone ?? '').replace(/\D/g, '')
    const valid = digits.length >= 10 && digits.length <= 13
    return makeResult(valid, valid ? 'Valid phone number' : 'Please enter a valid phone number')
  }

  const validateURL = (url) => {
    const value = typeof url === 'string' ? url.trim() : ''
    if (!value) return makeResult(false, 'URL is required')
    try {
      const parsed = new URL(value)
      const valid = ['http:', 'https:'].includes(parsed.protocol)
      return makeResult(valid, valid ? 'Valid URL' : 'Please enter a valid URL (http/https only)')
    } catch (error) {
      return makeResult(false, 'Please enter a valid URL (http/https only)')
    }
  }

  const validateNumeric = (value, fieldName = 'This field') => {
    const valid = /^-?\d*(\.\d+)?$/.test(String(value ?? '').trim())
    return makeResult(valid, valid ? 'Valid number' : `${fieldName} must contain only numbers`)
  }

  const validateRange = (value, min, max, fieldName = 'This field') => {
    const numericValue = Number(value)
    const valid = !Number.isNaN(numericValue) && numericValue >= min && numericValue <= max
    return makeResult(valid, valid ? 'Within range' : `${fieldName} must be between ${min} and ${max}`)
  }

  const validateFile = (file, allowedTypes = [], maxSize = Infinity) => {
    if (!file) return makeResult(false, 'Please upload a file')
    if (allowedTypes.length && !allowedTypes.includes(file.type)) {
      return makeResult(false, 'Unsupported file type')
    }
    if (file.size > maxSize) {
      return makeResult(false, 'File size exceeds the allowed limit')
    }
    return makeResult(true, 'File is valid')
  }

  const validateCheckbox = (isChecked, fieldName = 'this option') => {
    const valid = Boolean(isChecked)
    return makeResult(valid, valid ? 'Accepted' : `Please accept ${fieldName}`)
  }

  const validateForm = (formData, rules) => {
    const errors = {}
    let overallValid = true

    const applyRule = (field, rule) => {
      const value = formData[field]
      const opts = { fieldName: rule.fieldName || field, ...rule }
      switch (rule.type) {
        case 'required':
          return validateRequired(value, opts.fieldName)
        case 'email':
          return validateEmail(value)
        case 'password':
          return validatePassword(value, opts.minLength)
        case 'passwordMatch':
          return validatePasswordMatch(value, formData[opts.matchWith])
        case 'minLength':
          return validateMinLength(value, opts.minLength, opts.fieldName)
        case 'maxLength':
          return validateMaxLength(value, opts.maxLength, opts.fieldName)
        case 'phone':
          return validatePhone(value)
        case 'url':
          return validateURL(value)
        case 'numeric':
          return validateNumeric(value, opts.fieldName)
        case 'range':
          return validateRange(value, opts.min, opts.max, opts.fieldName)
        case 'checkbox':
          return validateCheckbox(value, opts.fieldName)
        case 'file':
          return validateFile(value, opts.allowedTypes, opts.maxSize)
        default:
          return makeResult(true, 'Valid')
      }
    }

    Object.keys(rules || {}).forEach((field) => {
      const fieldRules = Array.isArray(rules[field]) ? rules[field] : []
      for (const rule of fieldRules) {
        const result = applyRule(field, rule)
        if (!result.valid) {
          overallValid = false
          errors[field] = result.message
          break
        }
      }
    })

    return { valid: overallValid, errors }
  }

  const Validation = {
    validateEmail,
    validatePassword,
    validatePasswordMatch,
    validateRequired,
    validateMinLength,
    validateMaxLength,
    validatePhone,
    validateURL,
    validateNumeric,
    validateRange,
    validateFile,
    validateCheckbox,
    validateForm
  }

  global.Validation = Validation
})(window)
