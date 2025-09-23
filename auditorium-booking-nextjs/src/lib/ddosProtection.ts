import { NextRequest, NextResponse } from 'next/server'
import { logger } from './logger'

/**
 * Advanced DDoS Protection System
 * Implements multiple layers of protection against various attack patterns
 */

interface RateLimitEntry {
  count: number
  resetTime: number
  blocked: boolean
  blockUntil?: number
  consecutiveViolations: number
  lastViolation?: number
}

interface AttackPattern {
  requests: number[]
  suspicious: boolean
  blocked: boolean
  userAgent?: string
}

// In-memory stores (in production, use Redis)
const rateLimitMap = new Map<string, RateLimitEntry>()
const ipAttackPatterns = new Map<string, AttackPattern>()
const globalRequestCount = new Map<string, number>()

// DDoS Protection Configuration
const DDOS_CONFIG = {
  // Basic rate limits
  REQUESTS_PER_MINUTE: 60,
  REQUESTS_PER_HOUR: 500,
  REQUESTS_PER_DAY: 2000,
  
  // Burst protection
  BURST_LIMIT: 10, // Max requests in 10 seconds
  BURST_WINDOW: 10000, // 10 seconds
  
  // Progressive blocking
  INITIAL_BLOCK_TIME: 60000, // 1 minute
  MAX_BLOCK_TIME: 86400000, // 24 hours
  BLOCK_MULTIPLIER: 2,
  
  // Attack detection thresholds
  SUSPICIOUS_THRESHOLD: 30, // requests per 10 seconds
  BOT_THRESHOLD: 100, // requests per minute
  
  // Global protection
  GLOBAL_LIMIT: 10000, // Total requests per minute across all IPs
  
  // Cleanup intervals
  CLEANUP_INTERVAL: 300000, // 5 minutes
  ENTRY_TTL: 3600000 // 1 hour
}

/**
 * Get client identifier with multiple fallbacks
 */
function getClientIdentifier(request: NextRequest): string {
  // Try multiple IP headers in order of preference
  const ipHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'cf-connecting-ip', // Cloudflare
    'x-forwarded',
    'forwarded-for',
    'forwarded'
  ]
  
  for (const header of ipHeaders) {
    const ip = request.headers.get(header)
    if (ip) {
      // Handle comma-separated IPs (take the first one)
      return ip.split(',')[0].trim()
    }
  }
  
  // Fallback to user agent + some headers for identification
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const acceptLanguage = request.headers.get('accept-language') || 'unknown'
  return `fallback_${Buffer.from(userAgent + acceptLanguage).toString('base64').slice(0, 16)}`
}

/**
 * Check for suspicious attack patterns
 */
function detectAttackPattern(identifier: string, now: number): boolean {
  const pattern = ipAttackPatterns.get(identifier) || {
    requests: [],
    suspicious: false,
    blocked: false
  }
  
  // Clean old requests (older than 1 minute)
  pattern.requests = pattern.requests.filter(time => now - time < 60000)
  
  // Add current request
  pattern.requests.push(now)
  
  // Check for burst attacks (too many requests in short time)
  const recentRequests = pattern.requests.filter(time => now - time < DDOS_CONFIG.BURST_WINDOW)
  if (recentRequests.length > DDOS_CONFIG.BURST_LIMIT) {
    pattern.suspicious = true
    logger.warn('Burst attack detected', { identifier, requests: recentRequests.length })
  }
  
  // Check for bot-like behavior
  if (pattern.requests.length > DDOS_CONFIG.BOT_THRESHOLD) {
    pattern.suspicious = true
    logger.warn('Bot-like behavior detected', { identifier, requests: pattern.requests.length })
  }
  
  ipAttackPatterns.set(identifier, pattern)
  return pattern.suspicious
}

/**
 * Check global rate limit to prevent coordinated attacks
 */
function checkGlobalLimit(now: number): boolean {
  const currentMinute = Math.floor(now / 60000)
  const currentCount = globalRequestCount.get(currentMinute.toString()) || 0
  
  if (currentCount >= DDOS_CONFIG.GLOBAL_LIMIT) {
    logger.warn('Global rate limit exceeded', { 
      count: currentCount, 
      limit: DDOS_CONFIG.GLOBAL_LIMIT 
    })
    return false
  }
  
  globalRequestCount.set(currentMinute.toString(), currentCount + 1)
  
  // Cleanup old entries
  for (const [key] of globalRequestCount) {
    if (parseInt(key) < currentMinute - 5) { // Keep last 5 minutes
      globalRequestCount.delete(key)
    }
  }
  
  return true
}

/**
 * Enhanced rate limiting with progressive blocking
 */
function checkEnhancedRateLimit(identifier: string, maxRequests: number, windowMs: number): {
  allowed: boolean
  remainingRequests?: number
  resetTime?: number
  blockTime?: number
} {
  const now = Date.now()
  const existing = rateLimitMap.get(identifier)
  
  // Check if currently blocked
  if (existing?.blocked && existing.blockUntil && now < existing.blockUntil) {
    return {
      allowed: false,
      blockTime: existing.blockUntil - now
    }
  }
  
  // Initialize or reset if window expired
  if (!existing || now > existing.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
      blocked: false,
      consecutiveViolations: existing?.consecutiveViolations || 0,
      lastViolation: existing?.lastViolation
    })
    return {
      allowed: true,
      remainingRequests: maxRequests - 1,
      resetTime: now + windowMs
    }
  }
  
  // Increment count
  existing.count++
  
  // Check if limit exceeded
  if (existing.count > maxRequests) {
    // Progressive blocking
    existing.consecutiveViolations++
    existing.lastViolation = now
    
    const blockTime = Math.min(
      DDOS_CONFIG.INITIAL_BLOCK_TIME * Math.pow(DDOS_CONFIG.BLOCK_MULTIPLIER, existing.consecutiveViolations - 1),
      DDOS_CONFIG.MAX_BLOCK_TIME
    )
    
    existing.blocked = true
    existing.blockUntil = now + blockTime
    
    logger.warn('Rate limit exceeded - progressive block applied', {
      identifier,
      violations: existing.consecutiveViolations,
      blockTimeMs: blockTime
    })
    
    return {
      allowed: false,
      blockTime: blockTime
    }
  }
  
  return {
    allowed: true,
    remainingRequests: maxRequests - existing.count,
    resetTime: existing.resetTime
  }
}

/**
 * Analyze request for suspicious characteristics
 */
function analyzeRequest(request: NextRequest): {
  suspicious: boolean
  reasons: string[]
} {
  const reasons: string[] = []
  const userAgent = request.headers.get('user-agent') || ''
  const referer = request.headers.get('referer') || ''
  
  // Check for common bot patterns
  const botPatterns = [
    /bot|crawler|spider|scraper/i,
    /curl|wget|http|python|go-http/i,
    /^$/  // Empty user agent
  ]
  
  if (botPatterns.some(pattern => pattern.test(userAgent))) {
    reasons.push('suspicious_user_agent')
  }
  
  // Check for missing common headers
  if (!request.headers.get('accept')) {
    reasons.push('missing_accept_header')
  }
  
  if (!request.headers.get('accept-language')) {
    reasons.push('missing_language_header')
  }
  
  // Check for suspicious referer patterns
  if (referer && !referer.includes(request.headers.get('host') || '')) {
    reasons.push('external_referer')
  }
  
  // Check request method patterns
  if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    reasons.push('unusual_method')
  }
  
  return {
    suspicious: reasons.length >= 2, // Suspicious if multiple indicators
    reasons
  }
}

/**
 * Main DDoS protection middleware
 */
export async function withDDoSProtection(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    strictMode?: boolean
    customLimits?: {
      requestsPerMinute?: number
      requestsPerHour?: number
      burstLimit?: number
    }
  } = {}
): Promise<NextResponse> {
  const now = Date.now()
  const identifier = getClientIdentifier(request)
  const { strictMode = false, customLimits = {} } = options
  
  try {
    // 1. Global protection check
    if (!checkGlobalLimit(now)) {
      logger.error('Global DDoS protection triggered', { identifier })
      return new NextResponse(
        JSON.stringify({ 
          error: 'Service temporarily unavailable. Please try again later.',
          retryAfter: 60
        }),
        { 
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
            'X-RateLimit-Global': 'exceeded'
          }
        }
      )
    }
    
    // 2. Attack pattern detection
    const isAttackPattern = detectAttackPattern(identifier, now)
    if (isAttackPattern && strictMode) {
      logger.warn('Attack pattern detected in strict mode', { identifier })
      return new NextResponse(
        JSON.stringify({ 
          error: 'Request blocked due to suspicious activity.',
          code: 'PATTERN_DETECTED'
        }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-Block-Reason': 'pattern'
          }
        }
      )
    }
    
    // 3. Request analysis
    const analysis = analyzeRequest(request)
    if (analysis.suspicious && strictMode) {
      logger.warn('Suspicious request characteristics detected', { 
        identifier,
        reasons: analysis.reasons
      })
      
      // Additional scrutiny for suspicious requests
      customLimits.requestsPerMinute = Math.floor((customLimits.requestsPerMinute || DDOS_CONFIG.REQUESTS_PER_MINUTE) / 2)
    }
    
    // 4. Enhanced rate limiting
    const rateLimit = checkEnhancedRateLimit(
      identifier,
      customLimits.requestsPerMinute || DDOS_CONFIG.REQUESTS_PER_MINUTE,
      60000 // 1 minute window
    )
    
    if (!rateLimit.allowed) {
      const retryAfter = rateLimit.blockTime ? Math.ceil(rateLimit.blockTime / 1000) : 60
      
      return new NextResponse(
        JSON.stringify({ 
          error: 'Too many requests. Please try again later.',
          retryAfter,
          blocked: !!rateLimit.blockTime
        }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': (customLimits.requestsPerMinute || DDOS_CONFIG.REQUESTS_PER_MINUTE).toString(),
            'X-RateLimit-Remaining': (rateLimit.remainingRequests || 0).toString(),
            'X-RateLimit-Reset': (rateLimit.resetTime || now + 60000).toString(),
            'X-Block-Time': rateLimit.blockTime?.toString() || '0'
          }
        }
      )
    }
    
    // 5. Add security headers to successful responses
    const response = await handler(request)
    
    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', (customLimits.requestsPerMinute || DDOS_CONFIG.REQUESTS_PER_MINUTE).toString())
    response.headers.set('X-RateLimit-Remaining', (rateLimit.remainingRequests || 0).toString())
    response.headers.set('X-RateLimit-Reset', (rateLimit.resetTime || now + 60000).toString())
    
    // Additional security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    
    return response
    
  } catch (error) {
    logger.error('DDoS protection middleware error', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * Cleanup function to remove old entries (call periodically)
 */
export function cleanupDDoSData(): void {
  const now = Date.now()
  
  // Cleanup rate limit entries
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime + DDOS_CONFIG.ENTRY_TTL) {
      rateLimitMap.delete(key)
    }
  }
  
  // Cleanup attack patterns
  for (const [key, pattern] of ipAttackPatterns.entries()) {
    const lastRequest = Math.max(...pattern.requests)
    if (now - lastRequest > DDOS_CONFIG.ENTRY_TTL) {
      ipAttackPatterns.delete(key)
    }
  }
  
  logger.debug('DDoS protection data cleanup completed', {
    rateLimitEntries: rateLimitMap.size,
    attackPatterns: ipAttackPatterns.size
  })
}

// Auto-cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupDDoSData, DDOS_CONFIG.CLEANUP_INTERVAL)
}

/**
 * Quick DDoS check for critical endpoints
 */
export function quickDDoSCheck(request: NextRequest): NextResponse | null {
  const identifier = getClientIdentifier(request)
  const now = Date.now()
  
  // Check if IP is currently blocked
  const existing = rateLimitMap.get(identifier)
  if (existing?.blocked && existing.blockUntil && now < existing.blockUntil) {
    const retryAfter = Math.ceil((existing.blockUntil - now) / 1000)
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'IP blocked due to previous violations.',
        retryAfter,
        blockTime: existing.blockUntil - now
      }),
      { 
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
          'X-Block-Reason': 'previous_violations'
        }
      }
    )
  }
  
  return null // Allow request to proceed
}

/**
 * Update DDoS metrics for monitoring (lightweight version for middleware)
 */
export function updateDDoSMetrics(request: NextRequest): void {
  const identifier = getClientIdentifier(request)
  const now = Date.now()
  
  // Update basic metrics for monitoring
  if (!ipAttackPatterns.has(identifier)) {
    ipAttackPatterns.set(identifier, {
      requests: [],
      suspicious: false,
      blocked: false
    })
  }
  
  const pattern = ipAttackPatterns.get(identifier)!
  pattern.requests.push(now)
  
  // Keep only recent requests (last 5 minutes)
  const fiveMinutesAgo = now - 5 * 60 * 1000
  pattern.requests = pattern.requests.filter((time: number) => time > fiveMinutesAgo)
}