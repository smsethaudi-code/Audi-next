'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ReactNode, useEffect } from 'react'
import { CircularProgress, Box } from '@mui/material'

interface ProtectedRouteProps {
  children: ReactNode
  adminOnly?: boolean
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session) {
      router.push('/login')
      return
    }

    if (adminOnly && session.user.role !== 'admin') {
      router.push('/dashboard')
      return
    }
  }, [session, status, router, adminOnly])

  if (status === 'loading') {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    )
  }

  if (!session) {
    return null
  }

  if (adminOnly && session.user.role !== 'admin') {
    return null
  }

  return <>{children}</>
}
