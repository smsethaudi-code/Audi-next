import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { logger, checkRateLimit } from '@/lib/logger'
import { withSecureHeaders, sanitizeResponse } from '@/lib/apiSecurity'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting - 60 requests per minute for session checks
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous'
    if (!checkRateLimit(`session_${identifier}`, 60, 60000)) {
      logger.warn('Rate limit exceeded for session endpoint', { identifier })
      return NextResponse.json({ 
        error: 'Too many requests. Please try again later.' 
      }, { status: 429 })
    }

    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      // Return null for unauthenticated users (standard NextAuth behavior)
      const response = NextResponse.json(null)
      return withSecureHeaders(response)
    }

    // Sanitize session data - remove any sensitive information
    const sanitizedSession = sanitizeResponse({
      user: {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role,
        image: session.user.image,
        // Email is intentionally excluded for security
      },
      expires: session.expires
    })

    logger.debug('Session retrieved successfully', { 
      userId: session.user.id, 
      role: session.user.role 
    })

    const response = NextResponse.json(sanitizedSession)
    return withSecureHeaders(response)

  } catch (error) {
    logger.error('Session endpoint error', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Optionally support POST for consistency with NextAuth
export async function POST(request: NextRequest) {
  return GET(request)
}