'use client'

import React, { useEffect, useState } from 'react'
import { 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Typography, 
  Box, 
  IconButton, 
  Slide, 
  useTheme,
  Card,
  CardContent
} from '@mui/material'
import { 
  GetApp as InstallIcon, 
  Close as CloseIcon,
  Smartphone,
  Speed,
  CloudOff,
  Home
} from '@mui/icons-material'
import { TransitionProps } from '@mui/material/transitions'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />
})

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [showFloatingButton, setShowFloatingButton] = useState(false)
  const theme = useTheme()

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
      
      // Show floating button after 3 seconds
      setTimeout(() => {
        setShowFloatingButton(true)
      }, 3000)
      
      // Show dialog after 10 seconds if user hasn't interacted
      setTimeout(() => {
        if (!isInstalled) {
          setShowDialog(true)
        }
      }, 10000)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
      setShowDialog(false)
      setShowFloatingButton(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isInstalled])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted PWA installation')
        setShowDialog(false)
        setShowFloatingButton(false)
      }
      
      setDeferredPrompt(null)
      setIsInstallable(false)
    } catch (error) {
      console.error('Error showing install prompt:', error)
    }
  }

  const handleDialogOpen = () => {
    setShowDialog(true)
    setShowFloatingButton(false)
  }

  const handleDialogClose = () => {
    setShowDialog(false)
    // Show floating button again after dialog is closed
    setTimeout(() => {
      if (isInstallable && !isInstalled) {
        setShowFloatingButton(true)
      }
    }, 2000)
  }

  if (isInstalled || !isInstallable) {
    return null
  }

  const features = [
    {
      icon: <Speed color="primary" />,
      title: "Lightning Fast",
      description: "50% faster loading than web version"
    },
    {
      icon: <CloudOff color="primary" />,
      title: "Works Offline",
      description: "Access your bookings without internet"
    },
    {
      icon: <Home color="primary" />,
      title: "Home Screen Access",
      description: "Launch directly from your home screen"
    },
    {
      icon: <Smartphone color="primary" />,
      title: "Native Experience",
      description: "Full-screen app without browser UI"
    }
  ]

  return (
    <>
      {/* Floating Install Button */}
      {showFloatingButton && (
        <Button
          variant="contained"
          size="large"
          startIcon={<InstallIcon />}
          onClick={handleDialogOpen}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1000,
            backgroundColor: 'primary.main',
            color: 'white',
            borderRadius: 3,
            px: 3,
            py: 1.5,
            fontWeight: 600,
            boxShadow: '0 8px 32px rgba(30, 64, 175, 0.3)',
            '&:hover': {
              backgroundColor: 'primary.dark',
              transform: 'translateY(-2px)',
              boxShadow: '0 12px 40px rgba(30, 64, 175, 0.4)',
            },
            transition: 'all 0.3s ease',
            animation: 'pulse 2s infinite'
          }}
        >
          Install App
        </Button>
      )}

      {/* Enhanced Install Dialog */}
      <Dialog
        open={showDialog}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
            boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          pb: 1,
          position: 'relative'
        }}>
          <IconButton
            onClick={handleDialogClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
          
          <Box sx={{ mt: 2 }}>
            <InstallIcon 
              sx={{ 
                fontSize: 48, 
                color: 'primary.main',
                mb: 1
              }} 
            />
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Install Poornima Auditorium
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Get the full app experience with native performance
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ px: 3, pb: 2 }}>
          <Box sx={{ 
            display: 'grid', 
            gap: 2, 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            mb: 3
          }}>
            {features.map((feature, index) => (
              <Card 
                key={index}
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  background: 'rgba(30, 64, 175, 0.05)',
                  border: '1px solid rgba(30, 64, 175, 0.1)',
                  borderRadius: 2
                }}
              >
                <CardContent sx={{ p: '8px !important' }}>
                  {feature.icon}
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 1 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Box sx={{ 
            textAlign: 'center', 
            p: 2, 
            backgroundColor: 'rgba(46, 125, 50, 0.1)',
            borderRadius: 2,
            border: '1px solid rgba(46, 125, 50, 0.2)'
          }}>
            <Typography variant="body2" color="success.main" fontWeight="medium">
              ✨ No app store required • Automatic updates • Secure installation
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={handleDialogClose}
            sx={{ mr: 1 }}
          >
            Maybe Later
          </Button>
          <Button
            variant="contained"
            onClick={handleInstallClick}
            startIcon={<InstallIcon />}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              fontWeight: 600,
              background: 'linear-gradient(45deg, #1e40af 30%, #3b82f6 90%)',
              boxShadow: '0 6px 20px rgba(30, 64, 175, 0.3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1d4ed8 30%, #2563eb 90%)',
                boxShadow: '0 8px 25px rgba(30, 64, 175, 0.4)',
              },
            }}
          >
            Install Now
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default PWAInstallPrompt
