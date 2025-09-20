'use client'

import { useState } from 'react'
import { Container, Typography, Button, Box, Paper, TextField } from '@mui/material'
import QrScanner from 'qr-scanner'
import QRCode from 'qrcode'
import Navbar from '@/components/ui/Navbar'

export default function QRTestPage() {
  const [qrData, setQrData] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [testBookingData, setTestBookingData] = useState({
    bookingId: '67648ee6f123456789abcdef',
    eventName: 'Test Event',
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 3600000).toISOString(),
    eventType: 'Meeting',
    participantCount: 10
  })

  const generateTestQR = async () => {
    try {
      // Generate verification code (same logic as in QRCodeDisplay)
      const verificationCode = `${testBookingData.bookingId}-${testBookingData.eventName}-${new Date(testBookingData.startTime).getTime()}`
      const verificationHash = Buffer.from(verificationCode).toString('base64')
      
      const qrCodeData = {
        ...testBookingData,
        verificationCode: verificationHash,
        generatedAt: new Date().toISOString()
      }

      const qrString = JSON.stringify(qrCodeData)
      setQrData(qrString)
      
      // Generate QR code image
      const qrCodeDataUrl = await QRCode.toDataURL(qrString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      
      setQrCodeUrl(qrCodeDataUrl)
      
      console.log('Generated QR Data:', qrString)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  const testQrScanner = async () => {
    try {
      // Check if QR scanner is supported
      const hasCamera = await QrScanner.hasCamera()
      console.log('Has camera:', hasCamera)
      
      if (hasCamera) {
        console.log('QR Scanner is supported!')
        alert('QR Scanner is supported! Camera detected.')
      } else {
        console.log('No camera found')
        alert('No camera found on this device')
      }
    } catch (error: any) {
      console.error('QR Scanner test error:', error)
      alert('QR Scanner test failed: ' + (error?.message || 'Unknown error'))
    }
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ py: 4, pt: { xs: 10, md: 12 } }}>
        <Typography variant="h4" gutterBottom>
          QR Code Test Page
        </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Button 
          variant="contained" 
          onClick={testQrScanner}
          sx={{ mr: 2 }}
        >
          Test QR Scanner Support
        </Button>
        
        <Button 
          variant="outlined" 
          onClick={generateTestQR}
        >
          Generate Test QR Code
        </Button>
      </Box>

      {qrCodeUrl && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Test QR Code
          </Typography>
          <Box textAlign="center" sx={{ mb: 2 }}>
            <img src={qrCodeUrl} alt="Test QR Code" />
          </Box>
          <Typography variant="caption" component="div">
            Use this QR code to test scanning functionality
          </Typography>
        </Paper>
      )}

      {qrData && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            QR Code Data
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={6}
            value={qrData}
            variant="outlined"
            InputProps={{
              readOnly: true,
            }}
          />
          <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
            This is the data encoded in the QR code above
          </Typography>
        </Paper>
      )}
      </Container>
    </>
  )
}