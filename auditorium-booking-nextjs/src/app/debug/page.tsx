'use client'

import { useSession } from 'next-auth/react'
import { Container, Typography, Box, Card, CardContent } from '@mui/material'
import Navbar from '@/components/ui/Navbar'

export default function DebugPage() {
  const { data: session, status } = useSession()

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ mt: 4, pt: { xs: 8, md: 10 } }}>
        <Typography variant="h4" gutterBottom>
          Debug Information
        </Typography>
      
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Session Status: {status}
          </Typography>
          
          <Box component="pre" sx={{ 
            backgroundColor: 'grey.100', 
            p: 2, 
            borderRadius: 1,
            fontSize: '0.8rem',
            overflow: 'auto'
          }}>
            {JSON.stringify(session, null, 2)}
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Current URL: {typeof window !== 'undefined' ? window.location.href : 'Server-side'}
          </Typography>
          <Typography variant="body1">
            User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent : 'Server-side'}
          </Typography>
        </CardContent>
      </Card>
      </Container>
    </>
  )
}