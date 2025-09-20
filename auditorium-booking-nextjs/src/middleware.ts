import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

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

    // Allow the request to continue
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public routes
        const { pathname } = req.nextUrl
        const publicRoutes = ['/login', '/', '/debug']
        
        if (publicRoutes.includes(pathname)) {
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
     * - api/auth (NextAuth.js routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
