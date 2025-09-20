'use client';

import React, { useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  IconButton,
  useTheme,
  alpha
} from '@mui/material';
import {
  Google as GoogleIcon,
  ArrowBack
} from '@mui/icons-material';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { academicColorConstants } from '../../../theme/poornimaTheme';

const LoginPage = () => {
  const theme = useTheme();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // If already authenticated, redirect
  if (status === 'authenticated') {
    return null;
  }

  if (status === 'loading') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Typography variant="h6">Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        background: `linear-gradient(135deg, ${academicColorConstants.primary.main} 0%, ${academicColorConstants.secondary.main} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        overflow: 'hidden'
      }}
    >
      {/* Background decoration */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 20% 50%, ${alpha(academicColorConstants.tertiary.gold, 0.1)} 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, ${alpha(academicColorConstants.tertiary.cream, 0.1)} 0%, transparent 50%)`,
          pointerEvents: 'none'
        }}
      />

      {/* Return to Home Button */}
      <IconButton
        onClick={() => router.push('/')}
        sx={{
          position: 'absolute',
          top: { xs: 20, md: 30 },
          left: { xs: 20, md: 30 },
          backgroundColor: alpha(academicColorConstants.tertiary.cream, 0.2),
          color: academicColorConstants.tertiary.cream,
          size: { xs: 'small', md: 'medium' },
          '&:hover': {
            backgroundColor: alpha(academicColorConstants.tertiary.gold, 0.3),
            color: academicColorConstants.tertiary.gold,
            transform: 'translateY(-1px)'
          }
        }}
      >
        <ArrowBack sx={{ fontSize: { xs: 20, md: 24 } }} />
      </IconButton>

      {/* Gold Academic Cap Icon */}
      <Box
        sx={{
          position: 'absolute',
          top: { xs: 30, md: 40 },
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: { xs: '40px', md: '60px' },
          color: academicColorConstants.tertiary.gold
        }}
      >
        🎓
      </Box>

      <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
          {/* Main Title */}
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              color: '#ffffff',
              fontFamily: '"Playfair Display", serif',
              mb: 2,
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' },
              lineHeight: { xs: 1.2, md: 1.1 }
            }}
          >
            Auditorium Access Portal
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: alpha('#ffffff', 0.9),
              fontWeight: 400,
              maxWidth: '600px',
              mx: 'auto',
              fontSize: { xs: '1rem', md: '1.25rem' },
              px: { xs: 1, sm: 0 }
            }}
          >
            Secure authentication for auditorium booking and event management
          </Typography>
        </Box>

        {/* Login Card */}
        <Paper
          elevation={24}
          sx={{
            p: { xs: 4, sm: 5, md: 6 },
            borderRadius: 4,
            background: 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(20px)',
            maxWidth: { xs: '100%', sm: 450 },
            mx: 'auto',
            textAlign: 'center',
            boxShadow: `0 20px 40px ${alpha(academicColorConstants.primary.main, 0.3)}`
          }}
        >
          {/* Card Header */}
          <Typography
            variant="subtitle2"
            sx={{
              color: academicColorConstants.text.secondary,
              fontWeight: 600,
              letterSpacing: 2,
              textTransform: 'uppercase',
              mb: 2,
              fontSize: { xs: '0.75rem', md: '0.875rem' }
            }}
          >
            Authorized Access
          </Typography>
          
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: academicColorConstants.primary.main,
              fontFamily: '"Playfair Display", serif',
              mb: 3,
              fontSize: { xs: '1.75rem', md: '2rem' }
            }}
          >
            Sign In
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: academicColorConstants.text.secondary,
              mb: 4,
              lineHeight: 1.6,
              fontSize: { xs: '0.9rem', md: '1rem' }
            }}
          >
            Use your institutional email address to access the platform
          </Typography>

          {/* OAuth Button */}
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleGoogleLogin}
            startIcon={<GoogleIcon sx={{ fontSize: { xs: 20, md: 24 } }} />}
            disabled={isLoading}
            sx={{
              py: { xs: 2, md: 2.5 },
              mb: 3,
              fontSize: { xs: '1rem', md: '1.1rem' },
              fontWeight: 600,
              backgroundColor: academicColorConstants.primary.main,
              color: 'white',
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: `0 4px 15px ${alpha(academicColorConstants.primary.main, 0.3)}`,
              '&:hover': {
                backgroundColor: academicColorConstants.primary.dark,
                transform: 'translateY(-2px)',
                boxShadow: `0 6px 20px ${alpha(academicColorConstants.primary.main, 0.4)}`
              },
              '&:disabled': {
                backgroundColor: alpha(academicColorConstants.text.disabled, 0.3),
                color: academicColorConstants.text.disabled
              }
            }}
          >
            {isLoading ? 'Signing in...' : 'Continue with Google'}
          </Button>

         

          <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${alpha(academicColorConstants.text.secondary, 0.1)}` }}>
          
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;