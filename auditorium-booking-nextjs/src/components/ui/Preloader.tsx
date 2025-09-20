'use client'

import React, { useEffect, useState } from 'react'
import { Box, Typography, LinearProgress } from '@mui/material'
import { keyframes, styled } from '@mui/material/styles'

// Animation keyframes
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
`

const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

// Styled components
const PreloaderContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 25%, ${theme.palette.primary.light} 75%, ${theme.palette.secondary.main} 100%)`,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
    animation: `${rotate} 20s linear infinite`
  }
}))

const LogoContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  marginBottom: theme.spacing(4),
  animation: `${fadeIn} 1s ease-out, ${pulse} 2s ease-in-out infinite 1s`,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
    borderRadius: '50%',
    animation: `${pulse} 3s ease-in-out infinite`
  }
}))

const ShimmerText = styled(Typography)(({ theme }) => ({
  background: `linear-gradient(90deg, 
    rgba(255,255,255,0.8) 0%, 
    rgba(255,255,255,1) 50%, 
    rgba(255,255,255,0.8) 100%)`,
  backgroundSize: '200px 100%',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  animation: `${shimmer} 2s ease-in-out infinite, ${slideUp} 1s ease-out 0.5s both`,
  fontWeight: 700,
  textAlign: 'center',
  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
}))

const SubText = styled(Typography)(({ theme }) => ({
  color: 'rgba(255,255,255,0.9)',
  textAlign: 'center',
  animation: `${slideUp} 1s ease-out 1s both`,
  marginBottom: theme.spacing(4),
  fontWeight: 500
}))

const ProgressContainer = styled(Box)(({ theme }) => ({
  width: '300px',
  animation: `${slideUp} 1s ease-out 1.5s both`,
  position: 'relative'
}))

const StyledProgress = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: 'rgba(255,255,255,0.2)',
  '& .MuiLinearProgress-bar': {
    borderRadius: 4,
    background: `linear-gradient(90deg, 
      ${theme.palette.secondary.light} 0%, 
      ${theme.palette.secondary.main} 50%, 
      ${theme.palette.secondary.dark} 100%)`,
    backgroundSize: '200% 100%',
    animation: `${shimmer} 1.5s ease-in-out infinite`
  }
}))

const LoadingDots = styled(Box)({
  display: 'flex',
  gap: '8px',
  marginTop: '16px',
  justifyContent: 'center',
  '& .dot': {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.7)',
    animation: `${pulse} 1.4s ease-in-out infinite both`,
    '&:nth-of-type(1)': { animationDelay: '0s' },
    '&:nth-of-type(2)': { animationDelay: '0.2s' },
    '&:nth-of-type(3)': { animationDelay: '0.4s' }
  }
})

interface PreloaderProps {
  onLoadingComplete?: () => void
}

const Preloader: React.FC<PreloaderProps> = ({ onLoadingComplete }) => {
  const [progress, setProgress] = useState(0)
  const [loadingText, setLoadingText] = useState('Initializing...')

  const loadingSteps = [
    { text: 'Initializing...', duration: 800 },
    { text: 'Loading resources...', duration: 600 },
    { text: 'Setting up environment...', duration: 700 },
    { text: 'Connecting to services...', duration: 500 },
    { text: 'Preparing dashboard...', duration: 400 },
    { text: 'Almost ready...', duration: 300 },
    { text: 'Welcome to Dr. S.M Seth Auditorium!', duration: 200 }
  ]

  useEffect(() => {
    let currentStep = 0
    let currentProgress = 0

    const updateProgress = () => {
      if (currentStep < loadingSteps.length) {
        const step = loadingSteps[currentStep]
        setLoadingText(step.text)
        
        const targetProgress = ((currentStep + 1) / loadingSteps.length) * 100
        const progressIncrement = (targetProgress - currentProgress) / (step.duration / 16)
        
        const progressInterval = setInterval(() => {
          currentProgress += progressIncrement
          setProgress(Math.min(currentProgress, targetProgress))
          
          if (currentProgress >= targetProgress) {
            clearInterval(progressInterval)
            currentStep++
            
            setTimeout(() => {
              if (currentStep < loadingSteps.length) {
                updateProgress()
              } else {
                // Loading complete
                setTimeout(() => {
                  onLoadingComplete?.()
                }, 500)
              }
            }, 100)
          }
        }, 16)
      }
    }

    // Start loading animation after initial fade-in
    const timer = setTimeout(updateProgress, 1000)
    
    return () => clearTimeout(timer)
  }, [onLoadingComplete])

  return (
    <PreloaderContainer>
      <LogoContainer>
        <Box
          component="img"
          src="https://media.kshitijsinghbhati.in/Screenshot%202025-09-20%20133635.png"
          alt="Poornima Group Logo"
          sx={{
            width: 150,
            height: 150,
            borderRadius: '50%',
            border: '4px solid rgba(255,255,255,0.3)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            objectFit: 'contain',
            objectPosition: 'center',
            backgroundColor: 'rgba(255,255,255,0.1)',
            padding: '10px'
          }}
        />
      </LogoContainer>

      <ShimmerText variant="h3">
        Dr. S.M Seth Auditorium
      </ShimmerText>

      <SubText variant="h6">
        Poornima Group of Colleges
      </SubText>

      <SubText variant="body1" sx={{ opacity: 0.8, fontStyle: 'italic' }}>
        Achieving Excellence Together
      </SubText>

      <ProgressContainer>
        <StyledProgress 
          variant="determinate" 
          value={progress}
          sx={{ mb: 2 }}
        />
        
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'rgba(255,255,255,0.9)', 
            textAlign: 'center',
            minHeight: '1.5rem',
            transition: 'all 0.3s ease'
          }}
        >
          {loadingText}
        </Typography>

        <LoadingDots>
          <Box className="dot" />
          <Box className="dot" />
          <Box className="dot" />
        </LoadingDots>
      </ProgressContainer>
    </PreloaderContainer>
  )
}

export default Preloader
