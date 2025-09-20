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
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  GetApp as InstallIcon,
  Close as CloseIcon,
  Smartphone as MobileIcon,
  Computer as DesktopIcon
} from '@mui/icons-material'

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

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [showInstallDialog, setShowInstallDialog] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showManualInstructions, setShowManualInstructions] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [debugInfo, setDebugInfo] = useState('')
  
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  useEffect(() => {
    setMounted(true)
    
    // Only run client-side code after mounting
    if (typeof window === 'undefined') return

    // Debug PWA installation criteria
    const debugData = {
      isHTTPS: location.protocol === 'https:',
      hasServiceWorker: 'serviceWorker' in navigator,
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      userAgent: navigator.userAgent,
      hasManifest: document.querySelector('link[rel="manifest"]') !== null
    }
    
    setDebugInfo(JSON.stringify(debugData, null, 2))
    console.log('PWA Debug Info:', debugData)

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      console.log('✅ beforeinstallprompt event fired - PWA is installable!')
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    // Listen for successful app installation
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
      console.log('PWA was installed')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Check after a short delay if criteria might be met
    const timeoutCheck = setTimeout(() => {
      if (!deferredPrompt && !isInstalled) {
        console.log('❌ beforeinstallprompt event did not fire. PWA installation criteria may not be met.')
        console.log('Debug info:', debugData)
        
        // On mobile browsers, still show install option for manual installation
        if (isMobile) {
          setIsInstallable(true)
        }
      }
    }, 3000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      clearTimeout(timeoutCheck)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // For browsers that don't fire beforeinstallprompt, check if PWA is installable
      // and provide instructions
      setShowManualInstructions(true)
      return
    }

    try {
      // Hide the install dialog first
      setShowInstallDialog(false)

      // Show the browser's native install prompt
      await deferredPrompt.prompt()

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
      } else {
        console.log('User dismissed the install prompt')
      }

      // Clear the deferredPrompt
      setDeferredPrompt(null)
      setIsInstallable(false)
    } catch (error) {
      console.error('Error showing install prompt:', error)
      // Fallback to manual instructions
      setShowManualInstructions(true)
    }
  }

  const handleShowInstallDialog = () => {
    setShowInstallDialog(true)
  }

  const handleCloseDialog = () => {
    setShowInstallDialog(false)
    setShowManualInstructions(false)
  }

  // Don't show anything if already installed
  // Prevent hydration mismatch
  if (!mounted) {
    return null
  }

  if (isInstalled) {
    return null
  }

  return (
    <>
      {/* Floating Install Button - Always show if installable */}
      {isInstallable && (
        <Box
          sx={{
            position: 'fixed',
            bottom: { xs: 20, md: 20 },
            right: 20,
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 1
          }}
        >
          {/* Main Install Button */}
          <Button
            variant="contained"
            size="large"
            startIcon={<InstallIcon />}
            onClick={handleShowInstallDialog}
            sx={{
              backgroundColor: 'primary.main',
              color: 'white',
              borderRadius: 3,
              px: 3,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              boxShadow: '0 4px 20px rgba(30, 64, 175, 0.4)',
              '&:hover': {
                backgroundColor: 'primary.dark',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 25px rgba(30, 64, 175, 0.5)',
              },
              transition: 'all 0.3s ease',
              animation: 'pulse 2s infinite'
            }}
          >
            Install App
          </Button>
          
          {/* Small indicator for PWA readiness */}
          <Chip 
            label={deferredPrompt ? "Ready to Install" : "PWA Available"} 
            size="small" 
            color="success"
            sx={{ 
              fontSize: '0.75rem',
              backgroundColor: 'success.light',
              color: 'success.contrastText'
            }}
          />
        </Box>
      )}

      {/* Install Button - Legacy position */}
      {isInstallable && (
        <Button
          variant="outlined"
          startIcon={<InstallIcon />}
          onClick={handleShowInstallDialog}
          sx={{
            position: 'fixed',
            bottom: { xs: 90, md: 20 },
            left: 20,
            zIndex: 999,
            backgroundColor: 'background.paper',
            border: `2px solid ${theme.palette.primary.main}`,
            color: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.main',
              color: 'white'
            },
            boxShadow: theme.shadows[4]
          }}
        >
          {isMobile ? 'Install App' : 'Install PWA'}
        </Button>
      )}

      {/* Install Dialog */}
      <Dialog 
        open={showInstallDialog} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 2
        }}>
          <Typography variant="h6" component="div">
            Install Poornima Auditorium App
          </Typography>
          <IconButton onClick={handleCloseDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            {isMobile ? <MobileIcon sx={{ fontSize: 64, color: 'primary.main' }} /> : 
                       <DesktopIcon sx={{ fontSize: 64, color: 'primary.main' }} />}
          </Box>
          
          <Typography variant="body1" paragraph>
            Install the Poornima Group Auditorium Booking app for the best experience:
          </Typography>
          
          <Box component="ul" sx={{ pl: 2, mb: 3 }}>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              📱 Access from your home screen like a native app
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              🚀 Faster loading and better performance
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              📵 Works offline for viewing your bookings
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              🔔 Receive notifications about booking updates
            </Typography>
            <Typography component="li" variant="body2">
              💾 Automatic updates in the background
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Chip label="No App Store Required" color="primary" size="small" />
            <Chip label="Free Installation" color="success" size="small" />
            <Chip label="Cross-Platform" color="info" size="small" />
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Maybe Later
          </Button>
          <Button 
            onClick={handleInstallClick}
            variant="contained"
            startIcon={<InstallIcon />}
            sx={{ ml: 1 }}
          >
            Install Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manual Installation Instructions Dialog */}
      <Dialog 
        open={showManualInstructions} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <Typography variant="h6" component="div">
            How to Install
          </Typography>
          <IconButton onClick={handleCloseDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body1" paragraph>
            To install this app manually:
          </Typography>
          
          {isMobile ? (
            <Box>
              <Typography variant="h6" color="primary" gutterBottom>
                On Mobile (Chrome/Safari):
              </Typography>
              <Box component="ol" sx={{ pl: 2, mb: 3 }}>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Tap the browser menu (⋮ or share icon)
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Look for "Add to Home Screen" or "Install App"
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Tap it and confirm the installation
                </Typography>
                <Typography component="li" variant="body2">
                  Find the app icon on your home screen
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" color="primary" gutterBottom>
                On Desktop (Chrome/Edge):
              </Typography>
              <Box component="ol" sx={{ pl: 2, mb: 3 }}>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Click the install icon in the address bar (if available)
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Or go to browser menu → "Install Auditorium Booking..."
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Click "Install" in the popup
                </Typography>
                <Typography component="li" variant="body2">
                  The app will open in its own window
                </Typography>
              </Box>
            </Box>
          )}
          
          <Typography variant="body2" color="textSecondary">
            Note: Installation options may vary depending on your browser and device.
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseDialog} variant="contained" fullWidth>
            Got it!
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default PWAInstallPrompt
