import GoogleProvider from 'next-auth/providers/google'
import { AuthOptions } from 'next-auth'
import connectDB from '@/lib/db'
import User from '@/models/User'
import { logger } from './logger'

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile',
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        await connectDB()
        
        // Find or create user in database
        let dbUser = await User.findOne({ email: user.email })
        
        if (!dbUser) {
          // Create new user - role will be set automatically by pre-save middleware
          dbUser = await User.create({
            email: user.email,
            name: user.name,
            image: user.image
          })
        }
        
        token.role = dbUser.role
        token.userId = dbUser._id.toString()
        token.picture = user.image
        token.name = user.name
        token.email = user.email // Keep email in token for internal use
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role as string
        session.user.id = token.userId as string
        session.user.image = token.picture as string
        session.user.name = token.name as string
        
        // Remove email from session response for security
        // Email is kept in JWT token for internal API use but not exposed to client
        delete session.user.email
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Allow all Google OAuth sign-ins
      if (account?.provider === 'google') {
        return true
      }
      return false
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  events: {
    async signIn({ user, account, profile }) {
      logger.info('User signed in', { userRole: user.email ? 'authenticated' : 'unknown' })
    },
    async signOut({ session }) {
      logger.info('User signed out')
    },
  },
}
