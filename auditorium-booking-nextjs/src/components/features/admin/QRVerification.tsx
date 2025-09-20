'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
  IconButton,
  CircularProgress,
  Divider,
  Chip
} from '@mui/material'
import {
  QrCodeScanner as QrIcon,
  PhotoCamera as CameraIcon,
  Edit as ManualIcon,
  CheckCircle as VerifiedIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import QrScanner from 'qr-scanner'

interface BookingData {
  bookingId: string
  eventName: string
  startTime: string
  endTime: string
  eventType: string
  participantCount: number
  verificationCode: string
  generatedAt: string
}

interface QRVerificationProps {
  open: boolean
  onClose: () => void
  onVerificationSuccess: (bookingId: string, verificationData: BookingData) => void
}

const QRVerification: React.FC<QRVerificationProps> = ({
  open,
  onClose,
  onVerificationSuccess
}) => {
  const [tabValue, setTabValue] = useState(0)
  const [manualCode, setManualCode] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [scanError, setScanError] = useState('')
  const [verificationResult, setVerificationResult] = useState<BookingData | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [hasCamera, setHasCamera] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const qrScanner = useRef<QrScanner | null>(null)

  useEffect(() => {
    // Check if camera is available
    navigator.mediaDevices?.getUserMedia({ video: true })
      .then(() => setHasCamera(true))
      .catch(() => setHasCamera(false))

    return () => {
      stopScanning()
    }
  }, [])

  const startScanning = async () => {
    if (!videoRef.current) {
      setScanError('Video element not found')
      return
    }

    try {
      setIsScanning(true)
      setScanError('')
      
      console.log('Starting QR scanner...')
      
      // Check camera availability first
      const hasCamera = await QrScanner.hasCamera()
      console.log('Camera available:', hasCamera)
      
      if (!hasCamera) {
        throw new Error('No camera found on this device')
      }
      
      // Create QR scanner instance
      qrScanner.current = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('QR Code detected:', result.data)
          handleQRCodeDetected(result.data)
        },
        {
          preferredCamera: 'environment', // Use back camera
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 2,
          returnDetailedScanResult: true,
        }
      )

      // Start scanning
      await qrScanner.current.start()
      console.log('QR Scanner started successfully')
      
    } catch (error: any) {
      console.error('Error starting camera:', error)
      setScanError(`Unable to access camera: ${error?.message || 'Unknown error'}. Please check permissions or use manual input.`)
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    if (qrScanner.current) {
      qrScanner.current.stop()
      qrScanner.current.destroy()
      qrScanner.current = null
    }
    setIsScanning(false)
  }

  const handleQRCodeDetected = async (qrData: string) => {
    stopScanning()
    await verifyQRCode(qrData)
  }

  const handleManualSubmit = async () => {
    if (!manualCode.trim()) return
    await verifyQRCode(manualCode.trim())
  }

  const verifyQRCode = async (qrData: string) => {
    setIsVerifying(true)
    setScanError('')
    
    try {
      // Parse QR code data
      const bookingData: BookingData = JSON.parse(qrData)
      
      // Verify with backend
      const response = await fetch('/api/bookings/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: bookingData.bookingId,
          verificationCode: bookingData.verificationCode,
          action: 'verify'
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setVerificationResult(bookingData)
      } else {
        setScanError(result.message || 'Invalid or expired QR code')
      }
    } catch (error) {
      console.error('Verification error:', error)
      setScanError('Invalid QR code format or verification failed')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleConfirmVerification = () => {
    if (verificationResult) {
      onVerificationSuccess(verificationResult.bookingId, verificationResult)
      handleClose()
    }
  }

  const handleClose = () => {
    stopScanning()
    setTabValue(0)
    setManualCode('')
    setScanError('')
    setVerificationResult(null)
    setIsVerifying(false)
    onClose()
  }

  const resetVerification = () => {
    setVerificationResult(null)
    setScanError('')
    setManualCode('')
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <QrIcon />
          <Typography variant="h6">QR Code Verification</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {verificationResult ? (
          // Verification Success View
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <VerifiedIcon color="success" />
                <Typography variant="h6" color="success.main">
                  Booking Verified Successfully
                </Typography>
              </Box>
              
              <Box 
                sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
                  gap: 2 
                }}
              >
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Event Name
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {verificationResult.eventName}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Event Type
                  </Typography>
                  <Chip label={verificationResult.eventType} size="small" />
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Start Time
                  </Typography>
                  <Typography variant="body2">
                    {formatDateTime(verificationResult.startTime)}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    End Time
                  </Typography>
                  <Typography variant="body2">
                    {formatDateTime(verificationResult.endTime)}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Participants
                  </Typography>
                  <Typography variant="body1">
                    {verificationResult.participantCount}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Booking ID
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    {verificationResult.bookingId}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ) : (
          // Scanning Interface
          <>
            <Tabs 
              value={tabValue} 
              onChange={(_, newValue) => setTabValue(newValue)}
              sx={{ mb: 2 }}
            >
              <Tab 
                icon={<CameraIcon />} 
                label="Camera Scan" 
                disabled={!hasCamera}
              />
              <Tab 
                icon={<ManualIcon />} 
                label="Manual Input" 
              />
            </Tabs>

            {tabValue === 0 && (
              <Box>
                {!hasCamera ? (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Camera not available. Please use manual input.
                  </Alert>
                ) : (
                  <Box>
                    <Box
                      sx={{
                        position: 'relative',
                        width: '100%',
                        height: 300,
                        bgcolor: 'grey.100',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px dashed',
                        borderColor: isScanning ? 'primary.main' : 'grey.300',
                        borderRadius: 1,
                        mb: 2
                      }}
                    >
                      <video
                        ref={videoRef}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: isScanning ? 'block' : 'none'
                        }}
                        autoPlay
                        playsInline
                      />
                      
                      {!isScanning && (
                        <Box textAlign="center">
                          <QrIcon sx={{ fontSize: 64, color: 'grey.400', mb: 1 }} />
                          <Typography variant="body2" color="textSecondary">
                            Click "Start Scanning" to begin
                          </Typography>
                        </Box>
                      )}
                      
                      {isScanning && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: 200,
                            height: 200,
                            border: '2px solid',
                            borderColor: 'primary.main',
                            borderRadius: 2,
                            pointerEvents: 'none'
                          }}
                        />
                      )}
                    </Box>

                    <Box display="flex" justifyContent="center" gap={2}>
                      {!isScanning ? (
                        <Button
                          variant="contained"
                          startIcon={<CameraIcon />}
                          onClick={startScanning}
                          disabled={isVerifying}
                        >
                          Start Scanning
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          startIcon={<CancelIcon />}
                          onClick={stopScanning}
                        >
                          Stop Scanning
                        </Button>
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            {tabValue === 1 && (
              <Box>
                <TextField
                  fullWidth
                  label="QR Code Data"
                  placeholder="Paste or type the QR code content here"
                  multiline
                  rows={4}
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  disabled={isVerifying}
                  sx={{ mb: 2 }}
                />
                
                <Box display="flex" justifyContent="center">
                  <Button
                    variant="contained"
                    onClick={handleManualSubmit}
                    disabled={!manualCode.trim() || isVerifying}
                    startIcon={isVerifying ? <CircularProgress size={20} /> : <QrIcon />}
                  >
                    Verify Code
                  </Button>
                </Box>
              </Box>
            )}
          </>
        )}

        {scanError && (
          <Alert 
            severity="error" 
            sx={{ mt: 2 }}
            action={
              <IconButton size="small" onClick={resetVerification}>
                <RefreshIcon />
              </IconButton>
            }
          >
            {scanError}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          {verificationResult ? 'Close' : 'Cancel'}
        </Button>
        
        {verificationResult && (
          <Button
            variant="contained"
            color="success"
            onClick={handleConfirmVerification}
            startIcon={<VerifiedIcon />}
          >
            Confirm Verification
          </Button>
        )}
        
        {!verificationResult && scanError && (
          <Button
            variant="outlined"
            onClick={resetVerification}
            startIcon={<RefreshIcon />}
          >
            Try Again
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default QRVerification
