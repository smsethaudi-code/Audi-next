import { withAuth } from 'next-auth/middleware'
import { NextResponse, NextRequest } from 'next/server'
import { quickDDoSCheck, updateDDoSMetrics } from '@/lib/ddosProtection'

export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: any } }) {
    const { pathname } = req.nextUrl
    const token = req.nextauth?.token

    // Global DDoS protection for all API routes
    if (pathname.startsWith('/api/')) {
      // Quick check for blocked IPs
      const quickCheck = quickDDoSCheck(req)
      if (quickCheck) {
        return quickCheck
      }

      // Update DDoS metrics for monitoring
      updateDDoSMetrics(req)
    }

    // Protected routes that require authentication
    const protectedRoutes = ['/dashboard', '/admin', '/verification']
    
    // Admin-only routes
    const adminRoutes = ['/admin']
    
    // Check if the current path is protected
    const isProtectedRoute = protectedRoutes.some(route => 
      pathname.startsWith(route)
    )
    
    // Check if the current path requires admin access
    const isAdminRoute = adminRoutes.some(route => 
      pathname.startsWith(route)
    )

    // If it's a protected route and user is not authenticated
    if (isProtectedRoute && !token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // If it's an admin route and user is not an admin
    if (isAdminRoute && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Security headers for all responses
    const response = NextResponse.next()
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    
    // Additional security headers for API routes
    if (pathname.startsWith('/api/')) {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
      response.headers.set('Pragma', 'no-cache')
    }

    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public routes
        const { pathname } = req.nextUrl
        const publicRoutes = ['/login', '/', '/debug', '/offline']
        
        if (publicRoutes.includes(pathname) || pathname.startsWith('/api/auth')) {
          return true
        }
        
        // For all other routes, require authentication
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public|sw.js|workbox-).*)',
  ],
}
