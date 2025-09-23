'use client'

import { useEffect, useState } from 'react'
import { Box, Typography, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import QRCode from 'qrcode'
import { QrCode as QrCodeIcon, Download as DownloadIcon } from '@mui/icons-material'
import { logger } from '@/lib/logger'

interface QRCodeDisplayProps {
  bookingId: string
  eventName: string
  startTime: string
  endTime: string
  eventType: string
  participantCount: number
  size?: number
}

export default function QRCodeDisplay({ 
  bookingId, 
  eventName, 
  startTime, 
  endTime,
  eventType,
  participantCount,
  size = 200 
}: QRCodeDisplayProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Generate verification code (same logic as in API)
  const verificationCode = `${bookingId}-${eventName}-${new Date(startTime).getTime()}`
  const verificationHash = Buffer.from(verificationCode).toString('base64')

  // Only include essential data in QR code for security
  const qrData = JSON.stringify({
    bid: bookingId, // Shortened field names
    vc: verificationHash, // Verification code only
    ts: new Date(startTime).getTime() // Timestamp for validation
  })

  useEffect(() => {
    generateQRCode()
  }, [bookingId, eventName, startTime])

  const generateQRCode = async () => {
    try {
      setLoading(true)
      const url = await QRCode.toDataURL(qrData, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      setQrCodeUrl(url)
      logger.debug('QR code generated successfully')
    } catch (error) {
      logger.error('Error generating QR code', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a')
      link.href = qrCodeUrl
      link.download = `booking-qr-${bookingId}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const openQRDialog = () => {
    setDialogOpen(true)
  }

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" p={2}>
        <Typography variant="body2" color="textSecondary">Generating QR Code...</Typography>
      </Box>
    )
  }

  return (
    <>
      <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
        <Button
          variant="outlined"
          startIcon={<QrCodeIcon />}
          onClick={openQRDialog}
          size="small"
        >
          Show QR Code
        </Button>
        
        {qrCodeUrl && (
          <img 
            src={qrCodeUrl} 
            alt="Booking QR Code" 
            style={{ width: 60, height: 60, cursor: 'pointer' }}
            onClick={openQRDialog}
          />
        )}
      </Box>

      {/* QR Code Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <QrCodeIcon />
            Booking QR Code
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
              {qrCodeUrl && (
                <img 
                  src={qrCodeUrl} 
                  alt="Booking QR Code" 
                  style={{ width: size, height: size }}
                />
              )}
            </Paper>
            
            <Box textAlign="center">
              <Typography variant="h6" gutterBottom>
                {eventName}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {new Date(startTime).toLocaleDateString()} at {new Date(startTime).toLocaleTimeString()}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                to {new Date(endTime).toLocaleTimeString()}
              </Typography>
              
              <Typography variant="caption" display="block" sx={{ mt: 2 }}>
                Present this QR code to the admin on the day of your event for verification.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={downloadQRCode}
            startIcon={<DownloadIcon />}
            variant="outlined"
          >
            Download QR Code
          </Button>
          <Button onClick={() => setDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
