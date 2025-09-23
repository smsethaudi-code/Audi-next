/**
 * Secure Logging Service
 * - Only logs in development environment
 * - Sanitizes sensitive data in production
 * - Provides structured logging for better debugging
 */

const isDevelopment = process.env.NODE_ENV === 'development'

// Define sensitive keys that should never be logged
const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'key',
  'auth',
  'authorization',
  'cookie',
  'session',
  'email',
  'phone',
  'address',
  'creditcard',
  'ssn',
  'api_key',
  'access_token',
  'refresh_token',
  'private_key',
  'verificationCode',
  'verificationHash'
]

/**
 * Sanitize sensitive data from objects before logging
 */
function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeData)
  }

  const sanitized: any = {}
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase()
    const isSensitive = SENSITIVE_KEYS.some(sensitiveKey => 
      lowerKey.includes(sensitiveKey)
    )

    if (isSensitive) {
      sanitized[key] = '***REDACTED***'
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeData(value)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Secure logger that only logs in development
 */
export const logger = {
  info: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, data ? sanitizeData(data) : '')
    }
  },

  error: (message: string, error?: any) => {
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, error instanceof Error ? error.message : sanitizeData(error))
    }
    // In production, you might want to send errors to an external service
    // like Sentry, LogRocket, etc.
  },

  warn: (message: string, data?: any) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, data ? sanitizeData(data) : '')
    }
  },

  debug: (message: string, data?: any) => {
    if (isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data ? sanitizeData(data) : '')
    }
  }
}

/**
 * API Response sanitizer - removes sensitive fields from API responses
 */
export function sanitizeApiResponse(data: any): any {
  if (!data) return data

  // Remove common sensitive fields from API responses
  const sensitiveFields = [
    'verificationCode',
    'verificationHash', 
    'email',
    'userEmail',
    'phone',
    'address',
    'password',
    'token',
    'secret'
  ]

  if (Array.isArray(data)) {
    return data.map(item => sanitizeApiResponse(item))
  }

  if (typeof data === 'object') {
    const sanitized = { ...data }
    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        delete sanitized[field]
      }
    })
    return sanitized
  }

  return data
}

/**
 * Rate limiting helper for API endpoints
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now()
  const existing = rateLimitMap.get(identifier)

  if (!existing || now > existing.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (existing.count >= maxRequests) {
    return false
  }

  existing.count++
  return true
}

/**
 * Input validation helpers
 */
export const validate = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  mongoId: (id: string): boolean => {
    const mongoIdRegex = /^[0-9a-fA-F]{24}$/
    return mongoIdRegex.test(id)
  },

  dateTime: (dateTime: string): boolean => {
    const date = new Date(dateTime)
    return !isNaN(date.getTime())
  },

  positiveNumber: (num: any): boolean => {
    return typeof num === 'number' && num > 0
  },

  sanitizeInput: (input: string): string => {
    if (typeof input !== 'string') return ''
    return input.trim().replace(/[<>]/g, '')
  }
}