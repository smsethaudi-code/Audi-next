import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { logger, checkRateLimit, validate } from '@/lib/logger'
import { withDDoSProtection, quickDDoSCheck } from '@/lib/ddosProtection'

/**
 * Enhanced security middleware for API routes with DDoS protection
 */
export async function withApiSecurity(
  request: NextRequest,
  handler: (req: NextRequest, session: any) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean
    requireAdmin?: boolean
    rateLimit?: { requests: number; windowMs: number }
    validateInput?: boolean
    ddosProtection?: boolean
    strictMode?: boolean
  } = {}
) {
  const {
    requireAuth = true,
    requireAdmin = false,
    rateLimit = { requests: 100, windowMs: 60000 },
    validateInput = true,
    ddosProtection = true,
    strictMode = false
  } = options

  try {
    // 1. Quick DDoS check for blocked IPs
    if (ddosProtection) {
      const quickCheck = quickDDoSCheck(request)
      if (quickCheck) {
        return quickCheck
      }
    }

    // 2. Wrap with DDoS protection if enabled
    if (ddosProtection) {
      return await withDDoSProtection(
        request,
        async (req) => {
          return await processSecureRequest(req, handler, options)
        },
        {
          strictMode,
          customLimits: {
            requestsPerMinute: rateLimit.requests,
            burstLimit: strictMode ? 5 : 10
          }
        }
      )
    }

    // 3. Process without DDoS protection
    return await processSecureRequest(request, handler, options)

  } catch (error) {
    logger.error('Security middleware error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Process request with security checks
 */
async function processSecureRequest(
  request: NextRequest,
  handler: (req: NextRequest, session: any) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean
    requireAdmin?: boolean
    rateLimit?: { requests: number; windowMs: number }
    validateInput?: boolean
  }
): Promise<NextResponse> {
  const {
    requireAuth = true,
    requireAdmin = false,
    rateLimit = { requests: 100, windowMs: 60000 },
    validateInput = true
  } = options

  // 1. Authentication check
  let session = null
  if (requireAuth) {
    session = await getServerSession(authOptions)
    if (!session || !session.user) {
      logger.warn('Unauthorized API access attempt', {
        url: request.url,
        method: request.method,
        userAgent: request.headers.get('user-agent')
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // 2. Admin role check
  if (requireAdmin && session?.user?.role !== 'admin') {
    logger.warn('Non-admin attempted admin-only endpoint', {
      url: request.url,
      user: session?.user?.id,
      role: session?.user?.role
    })
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  // 3. Basic rate limiting (additional to DDoS protection)
  const identifier = session?.user?.id || session?.user?.email || request.headers.get('x-forwarded-for') || 'anonymous'
  const rateLimitKey = `${request.url.split('?')[0]}_${identifier}`
  
  if (!checkRateLimit(rateLimitKey, rateLimit.requests, rateLimit.windowMs)) {
    logger.warn('Rate limit exceeded', {
      url: request.url,
      user: identifier,
      limit: rateLimit.requests,
      window: rateLimit.windowMs
    })
    return NextResponse.json({ 
      error: 'Too many requests. Please try again later.' 
    }, { status: 429 })
  }

  // 4. Input validation for POST/PUT requests
  if (validateInput && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const contentType = request.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      try {
        const body = await request.json()
        
        // Create a new request with the parsed body for the handler
        const newRequest = new NextRequest(request.url, {
          method: request.method,
          headers: request.headers,
          body: JSON.stringify(body)
        })
        
        // Validate common fields
        if (body.email && !validate.email(body.email)) {
          logger.warn('Invalid email format in API request', { user: identifier })
          return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
        }

        return await handler(newRequest, session)
      } catch (error) {
        logger.warn('Invalid JSON in API request', { user: identifier })
        return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 })
      }
    }
  }

  // 5. Call the actual handler
  return await handler(request, session)
}

/**
 * CORS headers for secure API responses
 */
export function withSecureHeaders(response: NextResponse): NextResponse {
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  
  // Remove sensitive headers
  response.headers.delete('Server')
  response.headers.delete('X-Powered-By')
  
  return response
}

/**
 * Sanitize API response to remove sensitive data
 */
export function sanitizeResponse(data: any): any {
  if (!data) return data

  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'verificationCode',
    'verificationHash',
    'email',
    'userEmail',
    'phone',
    'coordinatorPhone'
  ]

  if (Array.isArray(data)) {
    return data.map(item => sanitizeResponse(item))
  }

  if (typeof data === 'object') {
    const sanitized = { ...data }
    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        delete sanitized[field]
      }
    })

    // Recursively sanitize nested objects
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = sanitizeResponse(sanitized[key])
      }
    })

    return sanitized
  }

  return data
}

/**
 * Input sanitization for API requests
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '').substring(0, 1000) // Limit length
  }

  if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item)).slice(0, 100) // Limit array size
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {}
    Object.keys(input).slice(0, 50).forEach(key => { // Limit object keys
      sanitized[key] = sanitizeInput(input[key])
    })
    return sanitized
  }

  return input
}