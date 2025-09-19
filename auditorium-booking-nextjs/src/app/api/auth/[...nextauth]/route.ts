import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { AuthOptions } from 'next-auth'
import connectDB from '@/lib/db'
import User from '@/models/User'

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
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role as string
        session.user.id = token.userId as string
        session.user.image = token.picture as string
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
      console.log('User signed in:', user.email)
    },
    async signOut({ session }) {
      console.log('User signed out')
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }