'use client'

import { AppBar, Toolbar, Typography, Button, Box, Menu, MenuItem, Avatar, IconButton, useTheme, useMediaQuery, Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton, Divider } from '@mui/material'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { AccountCircle, AdminPanelSettings, Dashboard, Event, ExitToApp, Menu as MenuIcon, Close } from '@mui/icons-material'

interface NavbarProps {
  hideSignIn?: boolean
}

export default function Navbar({ hideSignIn = false }: NavbarProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Auto-hide sign in button on home page
  const isHomePage = pathname === '/'
  const shouldHideSignIn = hideSignIn || isHomePage

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' })
    handleClose()
    setMobileMenuOpen(false)
  }

  const handleNavigation = (path: string) => {
    router.push(path)
    handleClose()
    setMobileMenuOpen(false)
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <>
      <AppBar position="static" elevation={2}>
        <Toolbar sx={{ px: { xs: 1, sm: 2 } }}>
          <Event sx={{ mr: 2, fontSize: { xs: 24, md: 28 } }} />
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              color: 'white',
              fontSize: { xs: '1rem', sm: '1.25rem' },
              fontWeight: { xs: 500, md: 400 }
            }}
          >
            Auditorium Booking System
          </Typography>

          {session ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {/* Desktop Menu */}
              {!isMobile && (
                <>
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
                </>
              )}

              {/* Mobile Menu Button */}
              {isMobile && (
                <IconButton
                  size="large"
                  edge="start"
                  color="inherit"
                  aria-label="menu"
                  onClick={toggleMobileMenu}
                  sx={{ mr: 1 }}
                >
                  <MenuIcon />
                </IconButton>
              )}

              {/* Profile Menu */}
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
                    sx={{ width: { xs: 28, md: 32 }, height: { xs: 28, md: 32 } }}
                  />
                ) : (
                  <AccountCircle sx={{ fontSize: { xs: 28, md: 32 } }} />
                )}
              </IconButton>
              
              {/* Desktop Profile Menu */}
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
                
                <MenuItem onClick={handleSignOut}>
                  <ExitToApp sx={{ mr: 1 }} />
                  Sign Out
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            !shouldHideSignIn && (
              <Button 
                color="inherit" 
                onClick={() => router.push('/login')}
                sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
              >
                Sign In
              </Button>
            )
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={toggleMobileMenu}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: 280, sm: 320 },
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Menu
          </Typography>
          <IconButton onClick={toggleMobileMenu}>
            <Close />
          </IconButton>
        </Box>
        <Divider />
        
        {session && (
          <List>
            <ListItem sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {session.user.image ? (
                  <Avatar 
                    src={session.user.image} 
                    alt={session.user.name || ''} 
                    sx={{ width: 40, height: 40 }}
                  />
                ) : (
                  <AccountCircle sx={{ fontSize: 40, color: 'grey.500' }} />
                )}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {session.user.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {session.user.email}
                  </Typography>
                </Box>
              </Box>
            </ListItem>
            <Divider />
            
            <ListItemButton onClick={() => handleNavigation('/dashboard')}>
              <ListItemIcon>
                <Dashboard />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItemButton>
            
            {session.user.role === 'admin' && (
              <ListItemButton onClick={() => handleNavigation('/admin')}>
                <ListItemIcon>
                  <AdminPanelSettings />
                </ListItemIcon>
                <ListItemText primary="Admin Panel" />
              </ListItemButton>
            )}
            
            <Divider sx={{ my: 1 }} />
            
            <ListItemButton onClick={handleSignOut}>
              <ListItemIcon>
                <ExitToApp />
              </ListItemIcon>
              <ListItemText primary="Sign Out" />
            </ListItemButton>
          </List>
        )}
      </Drawer>
    </>
  )
}
