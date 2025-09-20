'use client'

import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { ReactNode, useState, useEffect } from 'react'
import { poornimaTheme } from '@/theme/poornimaTheme'
import Preloader from '@/components/ui/Preloader'

interface ThemeProviderProps {
  children: ReactNode
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    const timer = setTimeout(() => {
      setLoading(false)
    }, 3000) // 3 second preloader

    return () => clearTimeout(timer)
  }, [])

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <MuiThemeProvider theme={poornimaTheme}>
        <CssBaseline />
        <Preloader />
      </MuiThemeProvider>
    )
  }

  if (loading) {
    return (
      <MuiThemeProvider theme={poornimaTheme}>
        <CssBaseline />
        <Preloader />
      </MuiThemeProvider>
    )
  }

  return (
    <MuiThemeProvider theme={poornimaTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  )
}