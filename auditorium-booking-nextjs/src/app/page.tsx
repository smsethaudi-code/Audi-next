'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Box, Container, Typography, Button } from '@mui/material';
import { Event as EventIcon } from '@mui/icons-material';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function HomePage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <LoadingSpinner message="Loading..." />;
  }

  if (status === 'authenticated') {
    return <LoadingSpinner message="Redirecting to dashboard..." />;
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Container maxWidth="lg" sx={{ pt: 8, pb: 8 }}>
        <Box textAlign="center" color="white">
          <EventIcon sx={{ fontSize: 80, mb: 2 }} />
          <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
            Auditorium Booking System
          </Typography>
          <Typography variant="h5" gutterBottom sx={{ mb: 4, opacity: 0.9 }}>
            Poornima University
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.8, maxWidth: 600, mx: 'auto' }}>
            Streamline your auditorium reservations with our comprehensive booking management system.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => router.push('/login')}
            sx={{
              py: 2,
              px: 4,
              fontSize: '1.2rem',
              borderRadius: 3,
              bgcolor: 'white',
              color: 'primary.main'
            }}
          >
            Get Started
          </Button>
        </Box>
      </Container>
    </Box>
  );
}