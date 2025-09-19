import { ReactNode } from 'react'
import { Box } from '@mui/material'
import Navbar from '@/components/ui/Navbar'
import ProtectedRoute from '@/components/ui/ProtectedRoute'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ProtectedRoute>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
          {children}
        </Box>
      </Box>
    </ProtectedRoute>
  )
}