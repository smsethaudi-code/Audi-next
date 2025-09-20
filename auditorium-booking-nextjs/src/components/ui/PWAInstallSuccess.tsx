'use client'

import React, { useEffect, useState } from 'react'
import { Snackbar, Alert, Typography, Box } from '@mui/material'
import { CheckCircle as SuccessIcon } from '@mui/icons-material'

const PWAInstallSuccess: React.FC = () => {
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    // Listen for successful PWA installation
    const handleAppInstalled = () => {
      setShowSuccess(true)
      
      // Hide after 5 seconds
      setTimeout(() => {
        setShowSuccess(false)
      }, 5000)
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  return (
    <Snackbar
      open={showSuccess}
      autoHideDuration={5000}
      onClose={() => setShowSuccess(false)}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert 
        severity="success" 
        onClose={() => setShowSuccess(false)}
        icon={<SuccessIcon />}
        sx={{ width: '100%' }}
      >
        <Box>
          <Typography variant="body2" fontWeight="bold">
            🎉 App Installed Successfully!
          </Typography>
          <Typography variant="caption">
            You can now access Auditorium Booking from your home screen.
          </Typography>
        </Box>
      </Alert>
    </Snackbar>
  )
}

export default PWAInstallSuccess