'use client'

import { useEffect, useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Container,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material'
import {
  Google as GoogleIcon,
  Security as SecurityIcon,
  School as SchoolIcon,
  Event as EventIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const session = await getSession()
      if (session) {
        router.push('/dashboard')
      }
    }
    checkAuth()
  }, [router])

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      const result = await signIn('google', {
        redirect: false,
        callbackUrl: '/dashboard',
      })
      
      if (result?.ok) {
        router.push('/dashboard')
      } else {
        console.error('Sign in failed:', result?.error)
      }
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={4} alignItems="center" justifyContent="center">
        {/* Login Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={6} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Box textAlign="center" mb={4}>
                <EventIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                  Auditorium Booking
                </Typography>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Poornima University
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Sign in to book auditorium slots and manage your reservations
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<GoogleIcon />}
                onClick={handleGoogleSignIn}
                disabled={loading}
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  borderRadius: 2,
                  textTransform: 'none',
                }}
              >
                {loading ? 'Signing in...' : 'Continue with Google'}
              </Button>

              <Typography variant="caption" display="block" textAlign="center" mt={2} color="textSecondary">
                Use your institutional Google account to sign in
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Features/Security Info */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
              <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Secure & Easy Booking
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <SchoolIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Student & Faculty Access"
                  secondary="Dedicated access for university members"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <EventIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Easy Booking Management"
                  secondary="View, create, and manage your auditorium bookings"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <AdminIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Admin Controls"
                  secondary="Administrative users can approve bookings and manage slots"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <SecurityIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="QR Code Verification"
                  secondary="Secure booking verification with QR codes"
                />
              </ListItem>
            </List>

            <Box mt={3} p={2} bgcolor="background.default" borderRadius={2}>
              <Typography variant="body2" color="textSecondary">
                <strong>Admin Access:</strong> esports@poornima.org
              </Typography>
              <Typography variant="body2" color="textSecondary" mt={1}>
                Regular users will have student/faculty access based on their email domain.
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}