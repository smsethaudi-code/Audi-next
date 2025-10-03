'use client'

import React, { useEffect, useState } from 'react'
import { Box, Typography, CircularProgress, Fade } from '@mui/material'
import { School, Event } from '@mui/icons-material'

const PWASplashScreen: React.FC = () => {
  const [show, setShow] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if app is running in standalone mode (installed as PWA)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(standalone)
    
    if (standalone) {
      setShow(true)
      // Hide splash screen after 2 seconds
      const timer = setTimeout(() => {
        setShow(false)
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [])

  if (!isStandalone || !show) {
    return null
  }

  return (
    <Fade in={show} timeout={500}>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          textAlign: 'center',
        }}
      >
        {/* App Icon */}
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
            animation: 'iconBounce 2s ease-in-out infinite',
          }}
        >
          <School sx={{ fontSize: 60, color: 'white' }} />
        </Box>

        {/* App Name */}
        <Typography 
          variant="h4" 
          fontWeight="bold" 
          sx={{ 
            mb: 1,
            background: 'linear-gradient(45deg, #ffffff 30%, #e0e7ff 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Poornima Auditorium
        </Typography>

        <Typography 
          variant="body1" 
          sx={{ 
            mb: 4, 
            opacity: 0.9,
            maxWidth: 300,
            px: 2
          }}
        >
          Dr. S.M Seth Auditorium Booking System
        </Typography>

        {/* Loading Indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Event sx={{ fontSize: 24, opacity: 0.7 }} />
          <CircularProgress 
            size={24} 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              }
            }} 
          />
        </Box>

        {/* Sanskrit Quote */}
        <Typography 
          variant="caption" 
          sx={{ 
            position: 'absolute',
            bottom: 60,
            opacity: 0.8,
            fontStyle: 'italic',
            px: 4,
            textAlign: 'center'
          }}
        >
          ज्ञानम् विना न किमपि साध्यम्
        </Typography>

        <Typography 
          variant="caption" 
          sx={{ 
            position: 'absolute',
            bottom: 40,
            opacity: 0.6,
            fontSize: '0.7rem'
          }}
        >
          Nothing is achievable without knowledge
        </Typography>
      </Box>
    </Fade>
  )
}

export default PWASplashScreen