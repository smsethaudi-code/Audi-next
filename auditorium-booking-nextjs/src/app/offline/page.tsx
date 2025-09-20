'use client'

import React from 'react'
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  Chip
} from '@mui/material'
import {
  CloudOff as OfflineIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'

const OfflinePage: React.FC = () => {
  const router = useRouter()

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleGoHome = () => {
    router.push('/')
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <OfflineIcon 
          sx={{ 
            fontSize: 80, 
            color: 'text.secondary', 
            mb: 2 
          }} 
        />
        
        <Typography variant="h4" gutterBottom color="textPrimary">
          You're Offline
        </Typography>
        
        <Typography variant="body1" color="textSecondary" paragraph>
          It looks like you're not connected to the internet. 
          This page requires an active internet connection to load.
        </Typography>

        <Chip 
          label="PWA Offline Mode" 
          color="info" 
          sx={{ mb: 3 }} 
        />
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            fullWidth
          >
            Try Again
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={handleGoHome}
            fullWidth
          >
            Go to Home
          </Button>
        </Box>

        <Typography variant="caption" color="textSecondary" sx={{ mt: 3, display: 'block' }}>
          Some cached content may still be available while offline.
        </Typography>
      </Paper>
    </Container>
  )
}

export default OfflinePage