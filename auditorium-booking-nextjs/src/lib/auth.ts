import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { AuthSession, UserRole } from '@/types/auth'

export async function getAuthSession(): Promise<AuthSession | null> {
  const session = await getServerSession(authOptions)
  return session as AuthSession | null
}

export function getUserRole(email: string): UserRole {
  // Admin email check - supports multiple admin emails
  const adminEmails = [
    process.env.ADMIN_EMAIL,
    process.env.SUPER_ADMIN_EMAIL,
    // Add more admin emails here if needed
    // 'another-admin@poornima.org'
  ].filter(Boolean) // Remove undefined values
  
  if (adminEmails.includes(email)) {
    return 'admin'
  }
  
  // Check if it's a faculty email (you can customize this logic)
  if (email.includes('faculty') || email.includes('prof') || email.includes('teacher')) {
    return 'faculty'
  }
  
  // Default to student
  return 'student'
}

export function isAdmin(role: string): boolean {
  return role === 'admin' || role === 'superadmin'
}

export function isFaculty(role: string): boolean {
  return role === 'faculty' || isAdmin(role)
}

export function canAccessAdmin(role: string): boolean {
  return isAdmin(role)
}

export function canCreateBooking(role: string): boolean {
  return ['student', 'faculty', 'admin', 'superadmin'].includes(role)
}

export function canApproveBooking(role: string): boolean {
  return isAdmin(role)
}

export function canViewAllBookings(role: string): boolean {
  return isAdmin(role)
}

export function canBlockTimeSlots(role: string): boolean {
  return isAdmin(role)
}
