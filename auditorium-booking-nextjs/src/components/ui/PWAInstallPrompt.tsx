'use client'

import React, { useEffect, useState } from 'react'
import { Button, Snackbar, Alert } from '@mui/material'
import { GetApp as InstallIcon, IosShare as IosShareIcon } from '@mui/icons-material'

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
  interface Window {
    // Captured by the inline script in app/layout.tsx, which runs before React loads
    __pwaInstallPrompt?: BeforeInstallPromptEvent | null
  }
}

const IOS_HINT_DISMISSED_KEY = 'pwa-ios-hint-dismissed'

// Keeps the floating prompts above the fixed footer
const aboveFooter = { xs: 110, sm: 90 }

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showIosHint, setShowIosHint] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    if (isStandalone) {
      setIsInstalled(true)
      return
    }

    // iOS never fires beforeinstallprompt - installing is Share -> Add to Home Screen
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    if (isIos) {
      let dismissed = false
      try {
        dismissed = localStorage.getItem(IOS_HINT_DISMISSED_KEY) === '1'
      } catch {
        // Storage unavailable (e.g. private mode) - just show the hint
      }
      setShowIosHint(!dismissed)
      return
    }

    // The event usually fires before this component mounts, so use the early-captured one
    if (window.__pwaInstallPrompt) {
      setDeferredPrompt(window.__pwaInstallPrompt)
      setIsInstallable(true)
    }

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      window.__pwaInstallPrompt = e
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      window.__pwaInstallPrompt = null
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        console.log('User accepted PWA installation')
      }

      // The event can only be used once
      window.__pwaInstallPrompt = null
      setDeferredPrompt(null)
      setIsInstallable(false)
    } catch (error) {
      console.error('Error showing install prompt:', error)
    }
  }

  const dismissIosHint = () => {
    setShowIosHint(false)
    try {
      localStorage.setItem(IOS_HINT_DISMISSED_KEY, '1')
    } catch {
      // Storage unavailable - the hint will simply show again next visit
    }
  }

  if (showIosHint) {
    return (
      <Snackbar
        open
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: aboveFooter }}
      >
        <Alert severity="info" icon={<IosShareIcon />} onClose={dismissIosHint} sx={{ width: '100%' }}>
          Install this app: tap the Share button, then &quot;Add to Home Screen&quot;
        </Alert>
      </Snackbar>
    )
  }

  if (isInstalled || !isInstallable) {
    return null
  }

  return (
    <Button
      variant="contained"
      size="large"
      startIcon={<InstallIcon />}
      onClick={handleInstallClick}
      sx={{
        position: 'fixed',
        bottom: aboveFooter,
        right: 20,
        zIndex: 1000,
        backgroundColor: 'primary.main',
        color: 'white',
        borderRadius: 3,
        px: 3,
        py: 1.5,
        fontWeight: 600,
        boxShadow: 3,
        '&:hover': {
          backgroundColor: 'primary.dark',
          transform: 'translateY(-2px)',
        },
        transition: 'all 0.3s ease'
      }}
    >
      Install App
    </Button>
  )
}

export default PWAInstallPrompt
