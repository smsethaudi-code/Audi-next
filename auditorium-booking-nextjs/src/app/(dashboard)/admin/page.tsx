'use client'

import { useState, useEffect } from 'react'
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  Pagination,
  Stack,
  useMediaQuery,
  useTheme,
  Paper,
  Divider
} from '@mui/material'
import {
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Schedule as PartialApproveIcon,
  Cancel as RejectIcon,
  Block as BlockIcon,
  Event as EventIcon,
  Pending as PendingIcon,
  QrCodeScanner as QrIcon,
  Download as DownloadIcon
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import QRVerification from '@/components/features/admin/QRVerification'
import { toCsv, downloadCsv } from '@/lib/csv'
import { formatISTDate, formatISTTime } from '@/lib/utils'

interface Booking {
  _id: string
  eventName: string
  eventType: string
  eventDescription: string
  startTime: string
  endTime: string
  status: string
  userName: string
  userEmail: string
  participantCount: number
  specialRequirements?: string
  rejectionReason?: string
  approvedBy?: string
  approvedAt?: string
  createdAt: string
  instituteName?: string
  coordinatorPhone?: string
  extraTimePre?: number
  extraTimePost?: number
  isExternal?: boolean
  totalCost?: number
  externalServices?: Record<string, boolean>
  isBlockedSlot?: boolean
  originalBlockedSlot?: BlockedTimeSlot
}

interface BlockedTimeSlot {
  _id: string
  startTime: string
  endTime: string
  reason: string
  blockedBy: string
  blockedByName: string
  isRecurring: boolean
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly'
    interval: number
    endDate?: string
  }
  createdAt: string
  updatedAt: string
}

interface BookingsApiResponse {
  bookings: Booking[]
}

interface BlockedSlotsApiResponse {
  blockedSlots: BlockedTimeSlot[]
}

interface VerificationData {
  verifiedBy: string
  verifiedAt: string
  actualParticipants?: number
}

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

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function AdminDashboard() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  const [bookings, setBookings] = useState<Booking[]>([])
  const [blockedSlots, setBlockedSlots] = useState<BlockedTimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [tabValue, setTabValue] = useState(0)
  
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('ALL') // ALL, UPCOMING, PAST
  const [fromDate, setFromDate] = useState('') // YYYY-MM-DD, filters on event start date
  const [toDate, setToDate] = useState('')

  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    type: 'approve' | 'partial-approve' | 'reject' | 'view' | 'cancel' | null
    booking: Booking | null
  }>({ open: false, type: null, booking: null })
  const [rejectionReason, setRejectionReason] = useState('')
  const [cancellationReason, setCancellationReason] = useState('')
  const [blockTimeDialog, setBlockTimeDialog] = useState(false)
  const [qrVerificationOpen, setQrVerificationOpen] = useState(false)
  const [blockTimeData, setBlockTimeData] = useState({
    startTime: '',
    endTime: '',
    reason: ''
  })

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)

      // Load every booking once - stats, the Pending tab, filters, pagination
      // and CSV export all work from this full list
      const [bookingsResponse, blockedResponse] = await Promise.all([
        fetch('/api/admin/bookings?action=all'),
        fetch('/api/bookings/block')
      ])

      if (bookingsResponse.ok) {
        const bookingsData: BookingsApiResponse = await bookingsResponse.json()
        setBookings(bookingsData.bookings)
      }

      if (blockedResponse.ok) {
        const blockedData: BlockedSlotsApiResponse = await blockedResponse.json()
        setBlockedSlots(blockedData.blockedSlots || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleBookingAction = async (action: 'approve' | 'partial-approve' | 'reject' | 'cancel') => {
    if (!actionDialog.booking) return

    try {
      const response = await fetch(`/api/admin/bookings/${actionDialog.booking._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          rejectionReason: action === 'reject' ? rejectionReason : undefined,
          cancellationReason: action === 'cancel' ? cancellationReason : undefined
        })
      })

      if (response.ok) {
        await fetchBookings()
        setActionDialog({ open: false, type: null, booking: null })
        setRejectionReason('')
        setCancellationReason('')
      }
    } catch (error) {
      console.error('Error updating booking:', error)
    }
  }

  const handleBlockTime = async () => {
    try {
      const response = await fetch('/api/bookings/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blockTimeData)
      })

      if (response.ok) {
        await fetchBookings()
        setBlockTimeDialog(false)
        setBlockTimeData({ startTime: '', endTime: '', reason: '' })
      }
    } catch (error) {
      console.error('Error blocking time:', error)
    }
  }

  const handleRemoveBlockedSlot = async (blockedSlotId: string) => {
    try {
      const response = await fetch(`/api/bookings/block?id=${blockedSlotId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchBookings()
      }
    } catch (error) {
      console.error('Error removing blocked slot:', error)
    }
  }

  const handleQRVerificationSuccess = async (bookingId: string, verificationData: BookingData) => {
    try {
      // Update local booking state
      setBookings(prev => prev.map(booking => 
        booking._id === bookingId 
          ? { ...booking, status: 'VERIFIED', verifiedAt: new Date().toISOString() }
          : booking
      ))
      
      // Refresh bookings from server
      await fetchBookings()
      
      // Show success message (you could add a toast notification here)
      console.log('Booking verified successfully:', verificationData)
      
    } catch (error) {
      console.error('Error updating booking status:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'success'
      case 'VERIFIED': return 'info'
      case 'PENDING': return 'warning'
      case 'REJECTED': return 'error'
      case 'CANCELLED': return 'default'
      case 'BLOCKED': return 'info'
      default: return 'default'
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

  // Mobile-friendly booking card component
  const BookingCard = ({ booking, showActions = true }: { booking: Booking, showActions?: boolean }) => (
    <Paper 
      elevation={1} 
      sx={{ 
        p: { xs: 2, sm: 3 }, 
        mb: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Stack spacing={2}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1} mr={2}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              {booking.eventName}
            </Typography>
            <Typography variant="caption" color="textSecondary" display="block">
              {booking.eventType}
            </Typography>
          </Box>
          <Chip
            label={booking.status === 'PARTIALLY_APPROVED' ? 'Partial Approved' : booking.status}
            color={booking.status === 'PARTIALLY_APPROVED' ? 'info' : getStatusColor(booking.status) as any}
            size="small"
            sx={{ fontSize: '0.7rem' }}
          />
        </Box>

        {/* Details Grid */}
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
            gap: 1.5,
            fontSize: { xs: '0.8rem', sm: '0.875rem' }
          }}
        >
          <Box>
            <Typography variant="caption" color="textSecondary" display="block">Organizer</Typography>
            <Typography variant="body2">{booking.userName}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="textSecondary" display="block">Participants</Typography>
            <Typography variant="body2">{booking.participantCount}</Typography>
          </Box>
          <Box sx={{ gridColumn: { xs: '1', sm: 'span 2' } }}>
            <Typography variant="caption" color="textSecondary" display="block">Date & Time</Typography>
            <Typography variant="body2">
              {formatDate(booking.startTime)} → {formatDate(booking.endTime)}
            </Typography>
          </Box>
          <Box sx={{ gridColumn: { xs: '1', sm: 'span 2' } }}>
            <Typography variant="caption" color="textSecondary" display="block">Email</Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{booking.userEmail}</Typography>
          </Box>
        </Box>

        {/* Actions */}
        {showActions && (
          <>
            <Divider />
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <IconButton
                size="small"
                onClick={() => setActionDialog({ open: true, type: 'view', booking })}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1
                }}
              >
                <ViewIcon fontSize="small" />
              </IconButton>
              
              {booking.isExternal && booking.status === 'PENDING' && (
                <IconButton
                  size="small"
                  color="warning"
                  onClick={() => setActionDialog({ open: true, type: 'partial-approve', booking })}
                  title="Partial Approval (Pending Payment)"
                  sx={{ 
                    border: '1px solid',
                    borderColor: 'warning.main',
                    borderRadius: 1
                  }}
                >
                  <PartialApproveIcon fontSize="small" />
                </IconButton>
              )}
              
              {(booking.status === 'PENDING' || 
                (booking.isExternal && booking.status === 'PARTIALLY_APPROVED')) && (
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => setActionDialog({ open: true, type: 'approve', booking })}
                  title={booking.status === 'PARTIALLY_APPROVED' ? 'Full Approval (Payment Received)' : 'Approve'}
                  sx={{ 
                    border: '1px solid',
                    borderColor: 'success.main',
                    borderRadius: 1
                  }}
                >
                  <ApproveIcon fontSize="small" />
                </IconButton>
              )}
              
              {(booking.status === 'PENDING' || 
                (booking.isExternal && booking.status === 'PARTIALLY_APPROVED')) && (
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => setActionDialog({ open: true, type: 'reject', booking })}
                  title={booking.status === 'PARTIALLY_APPROVED' ? 'Reject (Payment Not Received)' : 'Reject'}
                  sx={{ 
                    border: '1px solid',
                    borderColor: 'error.main',
                    borderRadius: 1
                  }}
                >
                  <RejectIcon fontSize="small" />
                </IconButton>
              )}
              
              {booking.status === 'APPROVED' && !booking.isBlockedSlot && (
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => setActionDialog({ open: true, type: 'cancel', booking })}
                  title="Cancel Approved Booking"
                  sx={{ 
                    border: '1px solid',
                    borderColor: 'error.main',
                    borderRadius: 1
                  }}
                >
                  <BlockIcon fontSize="small" />
                </IconButton>
              )}
              
              {(booking as any).isBlockedSlot && (
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleRemoveBlockedSlot((booking as any).originalBlockedSlot._id)}
                  title="Remove Blocked Time Slot"
                  sx={{ 
                    border: '1px solid',
                    borderColor: 'error.main',
                    borderRadius: 1
                  }}
                >
                  <RejectIcon fontSize="small" />
                </IconButton>
              )}
            </Stack>
          </>
        )}
      </Stack>
    </Paper>
  )

  const pendingBookings = bookings
    .filter(b => b.status === 'PENDING' || b.status === 'PARTIALLY_APPROVED')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  const partiallyApprovedBookings = bookings.filter(b => b.status === 'PARTIALLY_APPROVED')
  const approvedBookings = bookings.filter(b => b.status === 'APPROVED')
  const rejectedBookings = bookings.filter(b => b.status === 'REJECTED' || b.status === 'CANCELLED')

  // Blocked time slots are listed alongside bookings in the All Bookings tab
  const blockedSlotRows: Booking[] = blockedSlots.map(slot => ({
    _id: `blocked_${slot._id}`,
    eventName: `BLOCKED: ${slot.reason}`,
    eventType: 'Time Block',
    eventDescription: slot.reason,
    userName: 'Administrator',
    userEmail: 'admin',
    startTime: slot.startTime,
    endTime: slot.endTime,
    status: 'BLOCKED',
    createdAt: slot.createdAt,
    participantCount: 0,
    isBlockedSlot: true,
    originalBlockedSlot: slot,
    rejectionReason: '',
    specialRequirements: '',
    instituteName: 'Admin',
    coordinatorPhone: 'N/A',
    extraTimePre: 0,
    extraTimePost: 0,
    isExternal: false,
    totalCost: 0,
    externalServices: {}
  }))

  // All Bookings tab filters: status, upcoming/past and a from/to date range on the event start
  const now = new Date()
  const rangeStart = fromDate ? new Date(`${fromDate}T00:00:00`) : null
  const rangeEnd = toDate ? new Date(`${toDate}T23:59:59.999`) : null
  const invalidRange = Boolean(rangeStart && rangeEnd && rangeStart > rangeEnd)
  const hasActiveFilters = statusFilter !== 'ALL' || dateFilter !== 'ALL' || Boolean(fromDate) || Boolean(toDate)

  const statusFilteredBookings =
    statusFilter === 'ALL' ? [...bookings, ...blockedSlotRows] :
    statusFilter === 'BLOCKED' ? blockedSlotRows :
    bookings.filter(b => b.status === statusFilter)

  const filteredBookings = statusFilteredBookings
    .filter(b => {
      const start = new Date(b.startTime)
      if (dateFilter === 'UPCOMING' && start <= now) return false
      if (dateFilter === 'PAST' && start >= now) return false
      if (rangeStart && start < rangeStart) return false
      if (rangeEnd && start > rangeEnd) return false
      return true
    })
    // Upcoming: soonest first. Otherwise: latest first
    .sort((a, b) => dateFilter === 'UPCOMING'
      ? new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      : new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

  const pageCount = Math.max(1, Math.ceil(filteredBookings.length / pageSize))
  const page = Math.min(currentPage, pageCount)
  const pagedBookings = filteredBookings.slice((page - 1) * pageSize, page * pageSize)

  const clearFilters = () => {
    setStatusFilter('ALL')
    setDateFilter('ALL')
    setFromDate('')
    setToDate('')
    setCurrentPage(1)
  }

  const handleExportCsv = () => {
    const serviceLabels: Record<string, string> = {
      refreshments: 'Refreshments',
      transport: 'Transport',
      hostel: 'Hostel',
      mediaPhotoCoverage: 'Media/Photo Coverage'
    }
    const formatDateTime = (value?: string) =>
      value ? `${formatISTDate(new Date(value))} ${formatISTTime(new Date(value))}` : ''

    const headers = [
      'Booking ID', 'Event Name', 'Event Type', 'Status',
      'Date (IST)', 'Start Time (IST)', 'End Time (IST)', 'Duration (hours)',
      'Extra Time Before (min)', 'Extra Time After (min)', 'Participants',
      'Organizer Name', 'Organizer Email', 'Institute/Organization', 'Coordinator Phone',
      'External', 'External Services', 'Special Requirements', 'Description',
      'Rejection/Cancellation Reason', 'Requested On (IST)', 'Approved On (IST)'
    ]

    const rows = filteredBookings.map(booking => {
      const start = new Date(booking.startTime)
      const end = new Date(booking.endTime)
      const services = Object.entries(booking.externalServices || {})
        .filter(([, selected]) => selected)
        .map(([key]) => serviceLabels[key] || key)
        .join('; ')

      return [
        booking._id,
        booking.eventName,
        booking.eventType,
        booking.status,
        formatISTDate(start),
        formatISTTime(start),
        formatISTTime(end),
        Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60) * 100) / 100,
        booking.extraTimePre || 0,
        booking.extraTimePost || 0,
        booking.participantCount,
        booking.userName,
        booking.userEmail,
        booking.instituteName || '',
        booking.coordinatorPhone || '',
        booking.isExternal ? 'Yes' : 'No',
        services,
        booking.specialRequirements || '',
        booking.eventDescription || '',
        booking.rejectionReason || '',
        formatDateTime(booking.createdAt),
        formatDateTime(booking.approvedAt)
      ]
    })

    const rangeLabel =
      fromDate && toDate ? `${fromDate}_to_${toDate}` :
      fromDate ? `from_${fromDate}` :
      toDate ? `until_${toDate}` :
      `all_${formatISTDate(now)}`

    downloadCsv(`auditorium-bookings_${rangeLabel}.csv`, toCsv(headers, rows))
  }

  if (loading) {
    return <LoadingSpinner message="Loading admin dashboard..." />
  }

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 2, md: 4 }, mb: { xs: 8, md: 4 }, px: { xs: 1, sm: 2 } }}>
      {/* Header */}
      <Box mb={{ xs: 2, md: 4 }}>
        <Typography variant={isMobile ? "h5" : "h4"} gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
          Manage auditorium bookings, approve requests, and block time slots.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr 1fr', 
            sm: 'repeat(3, 1fr)', 
            md: 'repeat(5, 1fr)' 
          }, 
          gap: { xs: 1, sm: 2, md: 3 }, 
          mb: { xs: 2, md: 4 } 
        }}
      >
        <Box>
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
              <Box display="flex" alignItems="center" flexDirection={{ xs: 'column', sm: 'row' }}>
                <PendingIcon 
                  color="warning" 
                  sx={{ 
                    mr: { xs: 0, sm: 2 }, 
                    mb: { xs: 1, sm: 0 },
                    fontSize: { xs: 28, sm: 40 } 
                  }} 
                />
                <Box textAlign={{ xs: 'center', sm: 'left' }}>
                  <Typography variant={isSmallMobile ? "h6" : "h5"}>{pendingBookings.length}</Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                    {isSmallMobile ? 'Pending' : 'Pending & Partial'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
              <Box display="flex" alignItems="center" flexDirection={{ xs: 'column', sm: 'row' }}>
                <PartialApproveIcon 
                  color="info" 
                  sx={{ 
                    mr: { xs: 0, sm: 2 }, 
                    mb: { xs: 1, sm: 0 },
                    fontSize: { xs: 28, sm: 40 } 
                  }} 
                />
                <Box textAlign={{ xs: 'center', sm: 'left' }}>
                  <Typography variant={isSmallMobile ? "h6" : "h5"}>{partiallyApprovedBookings.length}</Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                    {isSmallMobile ? 'Partial' : 'Partially Approved'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
              <Box display="flex" alignItems="center" flexDirection={{ xs: 'column', sm: 'row' }}>
                <ApproveIcon 
                  color="success" 
                  sx={{ 
                    mr: { xs: 0, sm: 2 }, 
                    mb: { xs: 1, sm: 0 },
                    fontSize: { xs: 28, sm: 40 } 
                  }} 
                />
                <Box textAlign={{ xs: 'center', sm: 'left' }}>
                  <Typography variant={isSmallMobile ? "h6" : "h5"}>{approvedBookings.length}</Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                    Approved
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
              <Box display="flex" alignItems="center" flexDirection={{ xs: 'column', sm: 'row' }}>
                <RejectIcon 
                  color="error" 
                  sx={{ 
                    mr: { xs: 0, sm: 2 }, 
                    mb: { xs: 1, sm: 0 },
                    fontSize: { xs: 28, sm: 40 } 
                  }} 
                />
                <Box textAlign={{ xs: 'center', sm: 'left' }}>
                  <Typography variant={isSmallMobile ? "h6" : "h5"}>{rejectedBookings.length}</Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                    {isSmallMobile ? 'Rejected' : 'Rejected & Cancelled'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ gridColumn: { xs: 'span 2', sm: 'span 1' } }}>
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
              <Box display="flex" alignItems="center" flexDirection={{ xs: 'column', sm: 'row' }}>
                <EventIcon 
                  color="primary" 
                  sx={{ 
                    mr: { xs: 0, sm: 2 }, 
                    mb: { xs: 1, sm: 0 },
                    fontSize: { xs: 28, sm: 40 } 
                  }} 
                />
                <Box textAlign={{ xs: 'center', sm: 'left' }}>
                  <Typography variant={isSmallMobile ? "h6" : "h5"}>{bookings.length}</Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                    Total Bookings
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Action Buttons */}
      <Box mb={{ xs: 2, md: 3 }}>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={{ xs: 1, sm: 2 }}
          sx={{ width: '100%' }}
        >
          <Button
            variant="contained"
            startIcon={<BlockIcon />}
            onClick={() => setBlockTimeDialog(true)}
            size={isMobile ? 'small' : 'medium'}
            fullWidth={isSmallMobile}
            sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
          >
            {isSmallMobile ? 'Block Time' : 'Block Time Slot'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<QrIcon />}
            onClick={() => setQrVerificationOpen(true)}
            color="primary"
            size={isMobile ? 'small' : 'medium'}
            fullWidth={isSmallMobile}
            sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
          >
            {isSmallMobile ? 'Verify QR' : 'Verify QR Code'}
          </Button>
        </Stack>
      </Box>

      {/* Tabs */}
      <Card>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          sx={{
            '& .MuiTab-root': {
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              minWidth: { xs: 120, sm: 160 },
              px: { xs: 1, sm: 2 }
            }
          }}
        >
          <Tab label={isMobile ? `Pending (${pendingBookings.length})` : `Pending & Partial (${pendingBookings.length})`} />
          <Tab label={isMobile ? `All (${filteredBookings.length})` : `All Bookings (${filteredBookings.length})`} />
        </Tabs>

        {/* Pending & Partially Approved Requests Tab */}
        <TabPanel value={tabValue} index={0}>
          {pendingBookings.length === 0 ? (
            <Box textAlign="center" py={4}>
              <PendingIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary">
                No pending or partially approved requests
              </Typography>
            </Box>
          ) : (
            <>
              {/* Mobile View - Cards */}
              {isMobile ? (
                <Box sx={{ px: { xs: 0, sm: 1 } }}>
                  {pendingBookings.map((booking) => (
                    <BookingCard key={booking._id} booking={booking} />
                  ))}
                </Box>
              ) : (
                /* Desktop View - Table */
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Event Details</TableCell>
                        <TableCell>User</TableCell>
                        <TableCell>Date & Time</TableCell>
                        <TableCell>Participants</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Requested</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendingBookings.map((booking) => (
                        <TableRow key={booking._id}>
                          <TableCell>
                            <Typography variant="subtitle2">{booking.eventName}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              {booking.eventType}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{booking.userName}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              {booking.userEmail}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(booking.startTime)}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              to {formatDate(booking.endTime)}
                            </Typography>
                          </TableCell>
                          <TableCell>{booking.participantCount}</TableCell>
                          <TableCell>
                            <Chip 
                              label={booking.status === 'PARTIALLY_APPROVED' ? 'Partial Approved' : 'Pending'} 
                              color={booking.status === 'PARTIALLY_APPROVED' ? 'info' : 'warning'}
                              size="small"
                            />
                            {(booking as any).isExternal && (
                              <Chip 
                                label="External" 
                                color="secondary" 
                                size="small" 
                                sx={{ ml: 1 }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="textSecondary">
                              {formatDate(booking.createdAt)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => setActionDialog({ open: true, type: 'view', booking })}
                            >
                              <ViewIcon />
                            </IconButton>
                            {/* Show partial approve button only for external bookings that are pending */}
                            {(booking as any).isExternal && booking.status === 'PENDING' && (
                              <IconButton
                                size="small"
                                color="warning"
                                onClick={() => setActionDialog({ open: true, type: 'partial-approve', booking })}
                                title="Partial Approval (Pending Payment)"
                              >
                                <PartialApproveIcon />
                              </IconButton>
                            )}
                            {/* Show full approve button for all pending bookings, or partial -> full approve for external */}
                            {(booking.status === 'PENDING' || 
                              ((booking as any).isExternal && booking.status === 'PARTIALLY_APPROVED')) && (
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => setActionDialog({ open: true, type: 'approve', booking })}
                                title={booking.status === 'PARTIALLY_APPROVED' ? 'Full Approval (Payment Received)' : 'Approve'}
                              >
                                <ApproveIcon />
                              </IconButton>
                            )}
                            {/* Show reject button for pending bookings and partially approved external bookings */}
                            {(booking.status === 'PENDING' || 
                              ((booking as any).isExternal && booking.status === 'PARTIALLY_APPROVED')) && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setActionDialog({ open: true, type: 'reject', booking })}
                                title={booking.status === 'PARTIALLY_APPROVED' ? 'Reject (Payment Not Received)' : 'Reject'}
                              >
                                <RejectIcon />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </TabPanel>

        {/* All Bookings Tab */}
        <TabPanel value={tabValue} index={1}>
          {/* Filter Controls */}
          <Box sx={{ mb: 3 }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              alignItems={{ xs: 'stretch', md: 'flex-start' }}
              flexWrap="wrap"
              useFlexGap
            >
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status Filter"
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  <MenuItem value="ALL">All Statuses</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="PARTIALLY_APPROVED">Partially Approved</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                  <MenuItem value="VERIFIED">Verified</MenuItem>
                  <MenuItem value="BLOCKED">Blocked by Admin</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
                <InputLabel>Date Filter</InputLabel>
                <Select
                  value={dateFilter}
                  label="Date Filter"
                  onChange={(e) => {
                    setDateFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  <MenuItem value="ALL">All Dates</MenuItem>
                  <MenuItem value="UPCOMING">Upcoming</MenuItem>
                  <MenuItem value="PAST">Past</MenuItem>
                </Select>
              </FormControl>

              <TextField
                type="date"
                label="From Date"
                size="small"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value)
                  setCurrentPage(1)
                }}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: { xs: '100%', sm: 160 } }}
              />

              <TextField
                type="date"
                label="To Date"
                size="small"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value)
                  setCurrentPage(1)
                }}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: fromDate || undefined }}
                error={invalidRange}
                helperText={invalidRange ? 'To Date is before From Date' : undefined}
                sx={{ minWidth: { xs: '100%', sm: 160 } }}
              />

              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 } }}>
                <InputLabel>Page Size</InputLabel>
                <Select
                  value={pageSize}
                  label="Page Size"
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  <MenuItem value={5}>5 per page</MenuItem>
                  <MenuItem value={10}>10 per page</MenuItem>
                  <MenuItem value={20}>20 per page</MenuItem>
                  <MenuItem value={50}>50 per page</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 1, sm: 2 }}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              sx={{ mt: 2 }}
            >
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{
                  flexGrow: 1,
                  textAlign: { xs: 'center', sm: 'left' },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                Showing {Math.min((page - 1) * pageSize + 1, filteredBookings.length)} to {Math.min(page * pageSize, filteredBookings.length)} of {filteredBookings.length} bookings
              </Typography>
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  size={isMobile ? 'small' : 'medium'}
                  fullWidth={isSmallMobile}
                >
                  Clear Filters
                </Button>
              )}
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleExportCsv}
                disabled={filteredBookings.length === 0}
                size={isMobile ? 'small' : 'medium'}
                fullWidth={isSmallMobile}
                title="Download every booking matching the current filters (all pages)"
              >
                Export CSV ({filteredBookings.length})
              </Button>
            </Stack>
          </Box>

          {/* Bookings List */}
          {isMobile ? (
            /* Mobile View - Cards */
            <Box sx={{ px: { xs: 0, sm: 1 } }}>
              {pagedBookings.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Typography variant="body2" color="textSecondary">
                    No bookings found matching the current filters.
                  </Typography>
                </Box>
              ) : (
                pagedBookings.map((booking) => (
                  <BookingCard key={booking._id} booking={booking} />
                ))
              )}
            </Box>
          ) : (
            /* Desktop View - Table */
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Event Details</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedBookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="textSecondary">
                          No bookings found matching the current filters.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pagedBookings.map((booking) => (
                    <TableRow key={booking._id}>
                      <TableCell>
                        <Typography variant="subtitle2">{booking.eventName}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {booking.eventType}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{booking.userName}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {booking.userEmail}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(booking.startTime)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          to {formatDate(booking.endTime)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={booking.status}
                          color={getStatusColor(booking.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => setActionDialog({ open: true, type: 'view', booking })}
                        >
                          <ViewIcon />
                        </IconButton>
                        {/* Show cancel button for approved bookings, and remove button for blocked slots */}
                        {booking.status === 'APPROVED' && !(booking as any).isBlockedSlot && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setActionDialog({ open: true, type: 'cancel', booking })}
                            title="Cancel Approved Booking"
                          >
                            <BlockIcon />
                          </IconButton>
                        )}
                        {(booking as any).isBlockedSlot && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveBlockedSlot((booking as any).originalBlockedSlot._id)}
                            title="Remove Blocked Time Slot"
                          >
                            <RejectIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination */}
          {filteredBookings.length > 0 && (
            <Box sx={{
              mt: 3,
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2
            }}>
              <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Total: {filteredBookings.length} bookings
              </Typography>
              <Pagination
                count={pageCount}
                page={page}
                onChange={(event, newPage) => setCurrentPage(newPage)}
                color="primary"
                showFirstButton={!isSmallMobile}
                showLastButton={!isSmallMobile}
                size={isSmallMobile ? 'small' : 'medium'}
                sx={{
                  '& .MuiPaginationItem-root': {
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }
                }}
              />
            </Box>
          )}
        </TabPanel>
      </Card>

      {/* Action Dialogs */}
      <Dialog 
        open={actionDialog.open} 
        onClose={() => setActionDialog({ open: false, type: null, booking: null })}
        maxWidth="md"
        fullWidth
        fullScreen={isSmallMobile}
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: 1, sm: 2 },
            width: { xs: 'calc(100% - 16px)', sm: 'auto' }
          }
        }}
      >
        <DialogTitle sx={{ 
          fontSize: { xs: '1.1rem', sm: '1.25rem' },
          pb: { xs: 1, sm: 2 }
        }}>
          {actionDialog.type === 'approve' && 
            (actionDialog.booking?.status === 'PARTIALLY_APPROVED' ? 
              'Full Approval (Payment Received)' : 'Approve Booking')}
          {actionDialog.type === 'partial-approve' && 'Partial Approval (Pending Payment)'}
          {actionDialog.type === 'reject' && 'Reject Booking'}
          {actionDialog.type === 'cancel' && 'Cancel Approved Booking'}
          {actionDialog.type === 'view' && 'Booking Details'}
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
          {actionDialog.booking && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                {actionDialog.booking.eventName}
              </Typography>
              <Box 
                sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
                  gap: { xs: 1.5, sm: 2 }
                }}
              >
                <Box>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Event Type</Typography>
                  <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{actionDialog.booking.eventType}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Organizer</Typography>
                  <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{actionDialog.booking.userName}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Email</Typography>
                  <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, wordBreak: 'break-all' }}>{actionDialog.booking.userEmail}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Participants</Typography>
                  <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{actionDialog.booking.participantCount}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Start Time</Typography>
                  <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{formatDate(actionDialog.booking.startTime)}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>End Time</Typography>
                  <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{formatDate(actionDialog.booking.endTime)}</Typography>
                </Box>
                <Box sx={{ gridColumn: { xs: '1', sm: 'span 2' } }}>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Description</Typography>
                  <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{actionDialog.booking.eventDescription}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Status</Typography>
                  <Chip 
                    label={actionDialog.booking.status} 
                    color={
                      actionDialog.booking.status === 'APPROVED' ? 'success' :
                      actionDialog.booking.status === 'PARTIALLY_APPROVED' ? 'info' :
                      actionDialog.booking.status === 'REJECTED' ? 'error' :
                      actionDialog.booking.status === 'CANCELLED' ? 'default' :
                      actionDialog.booking.status === 'PENDING' ? 'warning' : 'default'
                    }
                    size="small"
                  />
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Created At</Typography>
                  <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{formatDate(actionDialog.booking.createdAt)}</Typography>
                </Box>

                {/* Additional Fields - Show in collapsed form on mobile */}
                {!isSmallMobile && (
                  <>
                    <Box>
                      <Typography variant="body2" color="textSecondary">Institute Name</Typography>
                      <Typography variant="body1">{(actionDialog.booking as any).instituteName || 'N/A'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">Coordinator Phone</Typography>
                      <Typography variant="body1">{(actionDialog.booking as any).coordinatorPhone || 'N/A'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">Extra Time Before (mins)</Typography>
                      <Typography variant="body1">{(actionDialog.booking as any).extraTimePre || 0}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">Extra Time After (mins)</Typography>
                      <Typography variant="body1">{(actionDialog.booking as any).extraTimePost || 0}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">External Event</Typography>
                      <Typography variant="body1">{(actionDialog.booking as any).isExternal ? 'Yes' : 'No'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">Total Cost</Typography>
                      <Typography variant="body1">₹{(actionDialog.booking as any).totalCost || 0}</Typography>
                    </Box>
                  </>
                )}
                
                {/* External Services */}
                {(actionDialog.booking as any).externalServices && (
                  <Box sx={{ mt: 2, gridColumn: { xs: '1', sm: 'span 2' } }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>External Services</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {(actionDialog.booking as any).externalServices.refreshments && (
                        <Chip label="Refreshments" size="small" color="primary" />
                      )}
                      {(actionDialog.booking as any).externalServices.transport && (
                        <Chip label="Transport" size="small" color="primary" />
                      )}
                      {(actionDialog.booking as any).externalServices.hostel && (
                        <Chip label="Hostel" size="small" color="primary" />
                      )}
                      {(actionDialog.booking as any).externalServices.mediaPhotoCoverage && (
                        <Chip label="Media/Photo Coverage" size="small" color="primary" />
                      )}
                    </Box>
                  </Box>
                )}

                {/* Approval Details */}
                {actionDialog.booking.status === 'APPROVED' && (actionDialog.booking as any).approvedAt && (
                  <Box sx={{ mt: 2, gridColumn: { xs: '1', sm: 'span 2' } }}>
                    <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Approved At</Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{formatDate((actionDialog.booking as any).approvedAt)}</Typography>
                  </Box>
                )}
                
                {/* Rejection Details */}
                {actionDialog.booking.status === 'REJECTED' && actionDialog.booking.rejectionReason && (
                  <Box sx={{ mt: 2, gridColumn: { xs: '1', sm: 'span 2' } }}>
                    <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Rejection Reason</Typography>
                    <Typography variant="body1" color="error" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{actionDialog.booking.rejectionReason}</Typography>
                  </Box>
                )}

                {/* Cancellation Details */}
                {actionDialog.booking.status === 'CANCELLED' && actionDialog.booking.rejectionReason && (
                  <Box sx={{ mt: 2, gridColumn: { xs: '1', sm: 'span 2' } }}>
                    <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Cancellation Reason</Typography>
                    <Typography variant="body1" color="error" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{actionDialog.booking.rejectionReason}</Typography>
                  </Box>
                )}

                {actionDialog.booking.specialRequirements && (
                  <Box sx={{ mt: 2, gridColumn: { xs: '1', sm: 'span 2' } }}>
                    <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Special Requirements</Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{actionDialog.booking.specialRequirements}</Typography>
                  </Box>
                )}
              </Box>

              {actionDialog.type === 'reject' && (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Rejection Reason (Optional)"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  sx={{ mt: 2 }}
                  size={isMobile ? 'small' : 'medium'}
                />
              )}

              {actionDialog.type === 'cancel' && (
                <Alert severity="warning" sx={{ mt: 2, mb: 2, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  <strong>Warning:</strong> Canceling an approved booking will permanently mark it as canceled. 
                  This action cannot be undone. Please provide a reason for the cancellation.
                </Alert>
              )}

              {actionDialog.type === 'cancel' && (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Cancellation Reason (Required for VIP priority or other reasons)"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  sx={{ mt: 2 }}
                  required
                  size={isMobile ? 'small' : 'medium'}
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          px: { xs: 2, sm: 3 }, 
          pb: { xs: 2, sm: 3 },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 0 }
        }}>
          <Button 
            onClick={() => setActionDialog({ open: false, type: null, booking: null })}
            fullWidth={isSmallMobile}
            size={isMobile ? 'small' : 'medium'}
          >
            Cancel
          </Button>
          {actionDialog.type === 'partial-approve' && (
            <Button 
              onClick={() => handleBookingAction('partial-approve')} 
              color="warning" 
              variant="contained"
              fullWidth={isSmallMobile}
              size={isMobile ? 'small' : 'medium'}
            >
              Partial Approve (Pending Payment)
            </Button>
          )}
          {actionDialog.type === 'approve' && (
            <Button 
              onClick={() => handleBookingAction('approve')} 
              color="success" 
              variant="contained"
              fullWidth={isSmallMobile}
              size={isMobile ? 'small' : 'medium'}
            >
              {actionDialog.booking?.status === 'PARTIALLY_APPROVED' ? 'Full Approve (Payment Received)' : 'Approve'}
            </Button>
          )}
          {actionDialog.type === 'reject' && (
            <Button 
              onClick={() => handleBookingAction('reject')} 
              color="error" 
              variant="contained"
              fullWidth={isSmallMobile}
              size={isMobile ? 'small' : 'medium'}
            >
              Reject
            </Button>
          )}
          {actionDialog.type === 'cancel' && (
            <Button 
              onClick={() => handleBookingAction('cancel')} 
              color="error" 
              variant="contained"
              disabled={!cancellationReason.trim()}
              fullWidth={isSmallMobile}
              size={isMobile ? 'small' : 'medium'}
            >
              Cancel Booking
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Block Time Dialog */}
      <Dialog 
        open={blockTimeDialog} 
        onClose={() => setBlockTimeDialog(false)}
        fullWidth
        maxWidth="sm"
        fullScreen={isSmallMobile}
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: 1, sm: 2 },
            width: { xs: 'calc(100% - 16px)', sm: 'auto' }
          }
        }}
      >
        <DialogTitle sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Block Time Slot</DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
          <Box 
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
              gap: { xs: 2, sm: 2 }, 
              mt: 1 
            }}
          >
            <TextField
              fullWidth
              type="datetime-local"
              label="Start Time"
              value={blockTimeData.startTime}
              onChange={(e) => setBlockTimeData({ ...blockTimeData, startTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
              size={isMobile ? 'small' : 'medium'}
            />
            <TextField
              fullWidth
              type="datetime-local"
              label="End Time"
              value={blockTimeData.endTime}
              onChange={(e) => setBlockTimeData({ ...blockTimeData, endTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
              size={isMobile ? 'small' : 'medium'}
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Reason for Blocking"
              value={blockTimeData.reason}
              onChange={(e) => setBlockTimeData({ ...blockTimeData, reason: e.target.value })}
              size={isMobile ? 'small' : 'medium'}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          px: { xs: 2, sm: 3 }, 
          pb: { xs: 2, sm: 3 },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 0 }
        }}>
          <Button 
            onClick={() => setBlockTimeDialog(false)}
            fullWidth={isSmallMobile}
            size={isMobile ? 'small' : 'medium'}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleBlockTime} 
            variant="contained"
            fullWidth={isSmallMobile}
            size={isMobile ? 'small' : 'medium'}
          >
            Block Time
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Verification Dialog */}
      <QRVerification
        open={qrVerificationOpen}
        onClose={() => setQrVerificationOpen(false)}
        onVerificationSuccess={handleQRVerificationSuccess}
      />
    </Container>
  )
}
