import { ReactNode } from 'react'
import { Box } from '@mui/material'
import Navbar from '@/components/ui/Navbar'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <>
      <Navbar />
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          pt: { xs: 10, md: 12 }, // Add top padding to account for navbar
        }}
      >
        {children}
      </Box>
    </>
  )
}