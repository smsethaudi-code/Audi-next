/**
 * Client-side logger that only logs in development
 * Use this instead of console.log/error/warn in client components
 */

const isDevelopment = typeof window !== 'undefined' && process.env.NODE_ENV === 'development'

export const clientLogger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },

  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args)
    }
    // In production, you might want to send errors to an external service
  },

  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },

  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args)
    }
  }
}

/**
 * Remove sensitive data from objects before logging
 */
export function sanitizeForClient(data: any): any {
  if (!data || typeof data !== 'object') {
    return data
  }

  const sensitive = ['email', 'userEmail', 'phone', 'password', 'token', 'verificationCode']
  const sanitized = { ...data }
  
  sensitive.forEach(key => {
    if (key in sanitized) {
      sanitized[key] = '***HIDDEN***'
    }
  })

  return sanitized
}