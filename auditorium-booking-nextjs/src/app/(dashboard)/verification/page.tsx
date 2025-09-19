'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  TextField,
  Grid,
  Alert,
  Chip
} from '@mui/material'
import {
  QrCode as QrCodeIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface VerificationResult {
  success: boolean
  booking?: {
    eventName: string
    eventType: string
    userName: string
    userEmail: string
    startTime: string
    endTime: string
    status: string
    participantCount: number
  }
  message: string
}

export default function VerificationPage() {
  const { data: session } = useSession()
  const [verificationCode, setVerificationCode] = useState('')
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(false)

  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      setResult({
        success: false,
        message: 'Please enter a verification code'
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/bookings/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationCode })
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to verify booking. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'success'
      case 'PENDING': return 'warning'
      case 'REJECTED': return 'error'
      default: return 'default'
    }
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box textAlign="center" mb={4}>
        <QrCodeIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Booking Verification
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Enter the verification code to verify a booking
        </Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={3}>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Verification Code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter the booking verification code"
                disabled={loading}
              />
            </Grid>
            
            <Grid size={12}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleVerify}
                disabled={loading || !verificationCode.trim()}
                sx={{ py: 2 }}
              >
                {loading ? <LoadingSpinner size={24} /> : 'Verify Booking'}
              </Button>
            </Grid>

            {result && (
              <Grid size={12}>
                <Alert 
                  severity={result.success ? 'success' : 'error'}
                  icon={result.success ? <CheckIcon /> : <ErrorIcon />}
                  sx={{ mb: result.success && result.booking ? 2 : 0 }}
                >
                  {result.message}
                </Alert>

                {result.success && result.booking && (
                  <Card variant="outlined" sx={{ mt: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        Booking Details
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="body2" color="textSecondary">
                            Event Name
                          </Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {result.booking.eventName}
                          </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="body2" color="textSecondary">
                            Event Type
                          </Typography>
                          <Typography variant="body1">
                            {result.booking.eventType}
                          </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="body2" color="textSecondary">
                            Organizer
                          </Typography>
                          <Typography variant="body1">
                            {result.booking.userName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {result.booking.userEmail}
                          </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="body2" color="textSecondary">
                            Participants
                          </Typography>
                          <Typography variant="body1">
                            {result.booking.participantCount}
                          </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="body2" color="textSecondary">
                            Start Time
                          </Typography>
                          <Typography variant="body1">
                            {formatDate(result.booking.startTime)}
                          </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="body2" color="textSecondary">
                            End Time
                          </Typography>
                          <Typography variant="body1">
                            {formatDate(result.booking.endTime)}
                          </Typography>
                        </Grid>

                        <Grid size={12}>
                          <Typography variant="body2" color="textSecondary">
                            Status
                          </Typography>
                          <Chip
                            label={result.booking.status}
                            color={getStatusColor(result.booking.status) as any}
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                )}
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      <Box mt={4} textAlign="center">
        <Typography variant="body2" color="textSecondary">
          Need help? Contact the admin for assistance.
        </Typography>
      </Box>
    </Container>
  )
}