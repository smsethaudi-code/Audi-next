import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession['user']
  }

  interface User {
    role: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
  }
}

export type UserRole = 'student' | 'faculty' | 'admin' | 'superadmin'

export interface AuthUser {
  id: string
  email: string
  name: string
  image?: string
  role: UserRole
}

export interface AuthSession {
  user: AuthUser
  expires: string
}