'use client'

import { AppBar, Toolbar, Typography, Button, Box, Menu, MenuItem, Avatar, IconButton } from '@mui/material'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AccountCircle, AdminPanelSettings, Dashboard, Event, ExitToApp } from '@mui/icons-material'

export default function Navbar() {
  const { data: session } = useSession()
  const router = useRouter()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' })
    handleClose()
  }

  const handleNavigation = (path: string) => {
    router.push(path)
    handleClose()
  }

  return (
    <AppBar position="static" elevation={2}>
      <Toolbar>
        <Event sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Auditorium Booking System
        </Typography>

        {session ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              color="inherit" 
              startIcon={<Dashboard />}
              onClick={() => router.push('/dashboard')}
              sx={{ mr: 1 }}
            >
              Dashboard
            </Button>
            
            {session.user.role === 'admin' && (
              <Button 
                color="inherit" 
                startIcon={<AdminPanelSettings />}
                onClick={() => router.push('/admin')}
                sx={{ mr: 1 }}
              >
                Admin
              </Button>
            )}

            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              {session.user.image ? (
                <Avatar 
                  src={session.user.image} 
                  alt={session.user.name || ''} 
                  sx={{ width: 32, height: 32 }}
                />
              ) : (
                <AccountCircle />
              )}
            </IconButton>
            
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={() => handleNavigation('/dashboard')}>
                <Dashboard sx={{ mr: 1 }} />
                Dashboard
              </MenuItem>
              
              {session.user.role === 'admin' && (
                <MenuItem onClick={() => handleNavigation('/admin')}>
                  <AdminPanelSettings sx={{ mr: 1 }} />
                  Admin Panel
                </MenuItem>
              )}
              
              <MenuItem onClick={() => handleNavigation('/verification')}>
                <Event sx={{ mr: 1 }} />
                Verify Booking
              </MenuItem>
              
              <MenuItem onClick={handleSignOut}>
                <ExitToApp sx={{ mr: 1 }} />
                Sign Out
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <Button color="inherit" onClick={() => router.push('/login')}>
            Sign In
          </Button>
        )}
      </Toolbar>
    </AppBar>
  )
}