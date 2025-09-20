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
  
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
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

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Show manual installation instructions
      setShowManualInstructions(true)
      return
    }

    // Hide the install dialog
    setShowInstallDialog(false)

    // Show the install prompt
    deferredPrompt.prompt()

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
  }

  const handleShowInstallDialog = () => {
    setShowInstallDialog(true)
  }

  const handleCloseDialog = () => {
    setShowInstallDialog(false)
    setShowManualInstructions(false)
  }

  // Don't show anything if already installed
  if (isInstalled) {
    return null
  }

  return (
    <>
      {/* Install Button */}
      {isInstallable && (
        <Button
          variant="outlined"
          startIcon={<InstallIcon />}
          onClick={handleShowInstallDialog}
          sx={{
            position: 'fixed',
            bottom: { xs: 90, md: 20 },
            right: 20,
            zIndex: 1000,
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