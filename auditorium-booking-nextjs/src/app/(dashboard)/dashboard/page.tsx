'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Container,
  Grid,
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
  Paper,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Stack,
  useTheme,
  alpha,
  useMediaQuery,
  Divider
} from '@mui/material'
import QRCodeDisplay from '@/components/ui/QRCodeDisplay'
import {
  Add as AddIcon,
  Event as EventIcon,
  Pending as PendingIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarMonth as CalendarIcon,
  AdminPanelSettings as AdminIcon,
  Cancel as CancelIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { 
  PageTransition, 
  AnimatedSection, 
  Glassmorphism, 
  StaggeredAnimation 
} from '@/components/ui/PageTransition'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import { DateTimePicker } from '@mui/x-date-pickers'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import { useFormik } from 'formik'
import * as yup from 'yup'
import AvailabilityCalendar from '@/components/ui/AvailabilityCalendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = momentLocalizer(moment)

const validationSchema = yup.object({
  eventName: yup.string().required('Event name is required'),
  eventType: yup.string().required('Event type is required'),
  eventDescription: yup.string(),
  participantCount: yup.number()
    .required('Number of participants is required')
    .min(1, 'Minimum 1 participant required')
    .max(1000, 'Maximum 1000 participants allowed'),
  startDateTime: yup.date().required('Start date and time is required'),
  endDateTime: yup.date()
    .required('End date and time is required')
    .min(yup.ref('startDateTime'), 'End time must be after start time'),
  instituteName: yup.string().required('Institute/Organization name is required'),
  coordinatorPhone: yup.string()
    .required('Coordinator phone number is required')
    .matches(/^\d{10}$/, 'Phone number must be 10 digits'),
  extraTimePre: yup.number()
    .min(0, 'Extra time cannot be negative')
    .max(120, 'Extra time cannot exceed 120 minutes')
    .default(0),
  extraTimePost: yup.number()
    .min(0, 'Extra time cannot be negative')
    .max(120, 'Extra time cannot exceed 120 minutes')
    .default(0)
})

const eventTypes = [
  'Academic',
  'Cultural',
  'Sports',
  'Workshop',
  'Seminar',
  'Conference',
  'Other'
]

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
  instituteName?: string
  coordinatorPhone?: string
  extraTimePre?: number
  extraTimePost?: number
  isExternal?: boolean
  externalServices?: {
    refreshments?: boolean
    transport?: boolean
    hostel?: boolean
    mediaPhotoCoverage?: boolean
  }
  rejectionReason?: string
  createdAt: string
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Booking
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
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  const [bookings, setBookings] = useState<Booking[]>([])
  const [allBookings, setAllBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [tabValue, setTabValue] = useState(0)
  const [bookingFormOpen, setBookingFormOpen] = useState(false)
  const [editBookingId, setEditBookingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isExternal, setIsExternal] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Check if user email is from external organization
  const isExternalUser = session?.user?.email && 
    !session.user.email.endsWith('@poornima.org') && 
    !session.user.email.endsWith('@poornima.edu.in')

  const formik = useFormik({
    initialValues: {
      eventName: '',
      eventType: '',
      eventDescription: '',
      participantCount: '',
      startDateTime: new Date(),
      endDateTime: new Date(),
      instituteName: '',
      coordinatorPhone: '',
      extraTimePre: 0,
      extraTimePost: 0,
      specialRequirements: '',
      isExternal: isExternalUser || false,
      externalBookingDetails: {
        refreshments: false,
        transport: false,
        hostel: false,
        mediaPhotoCoverage: false
      }
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setFormSubmitting(true)
        setFormError(null)
        
        const externalDetails = values.isExternal ? {
          refreshments: Boolean(values.externalBookingDetails.refreshments),
          transport: Boolean(values.externalBookingDetails.transport),
          hostel: Boolean(values.externalBookingDetails.hostel),
          mediaPhotoCoverage: Boolean(values.externalBookingDetails.mediaPhotoCoverage)
        } : {
          refreshments: false,
          transport: false,
          hostel: false,
          mediaPhotoCoverage: false
        }

        const formattedValues = {
          eventName: values.eventName,
          eventType: values.eventType,
          eventDescription: values.eventDescription,
          participantCount: Number(values.participantCount),
          startTime: values.startDateTime.toISOString(),
          endTime: values.endDateTime.toISOString(),
          instituteName: values.instituteName,
          coordinatorPhone: values.coordinatorPhone,
          extraTimePre: Number(values.extraTimePre),
          extraTimePost: Number(values.extraTimePost),
          specialRequirements: values.specialRequirements,
          isExternal: Boolean(values.isExternal),
          externalServices: externalDetails
        }

        const url = editBookingId 
          ? `/api/bookings/${editBookingId}` 
          : '/api/bookings'
        
        const method = editBookingId ? 'PATCH' : 'POST'
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formattedValues)
        })

        if (response.ok) {
          await fetchMyBookings()
          await fetchAllBookings()
          setBookingFormOpen(false)
          setEditBookingId(null)
          setFormError(null)
          formik.resetForm()
        } else {
          const error = await response.json()
          if (response.status === 409) {
            // Conflict error (time slot not available due to conflicts or blocking)
            if (error.type === 'blocked') {
              setFormError(`🚫 Time slot blocked by administrator: ${error.reason || 'Administrative block'}`)
            } else if (error.type === 'booking') {
              const conflictDetails = error.conflicts?.length > 0 
                ? ` (Conflict with: ${error.conflicts[0].eventName})` 
                : ''
              setFormError(`⚠️ Time slot not available - conflicts with existing booking`)
            } else if (error.error.includes('blocked by administrator')) {
              setFormError('🚫 Time slot not available - blocked by administrator')
            } else if (error.error.includes('conflicts with existing booking')) {
              setFormError('⚠️ Time slot not available - conflicts with existing booking')
            } else {
              setFormError('⚠️ Time slot not available')
            }
          } else if (response.status === 400) {
            // Validation errors - provide specific feedback
            if (error.error.includes('Invalid time slot')) {
              // This could be due to past time, outside hours, or duration issues
              const now = new Date()
              const startTime = new Date(formattedValues.startTime)
              const endTime = new Date(formattedValues.endTime)
              
              if (startTime <= now) {
                setFormError('Please select a future date and time for your booking')
              } else if (startTime.getHours() < 8 || endTime.getHours() > 22) {
                setFormError('Bookings are only allowed between 8:00 AM and 10:00 PM')
              } else if (endTime <= startTime) {
                setFormError('End time must be after start time')
              } else {
                const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
                if (durationHours > 12) {
                  setFormError('Maximum booking duration is 12 hours')
                } else {
                  setFormError('Please check your date and time selection')
                }
              }
            } else {
              setFormError(error.error)
            }
          } else {
            setFormError(error.error || 'Failed to save booking')
          }
        }
      } catch (error) {
        console.error('Error saving booking:', error)
        setFormError('Failed to save booking. Please try again.')
      } finally {
        setFormSubmitting(false)
      }
    },
  })

  useEffect(() => {
    fetchMyBookings()
    fetchAllBookings()
  }, [])

  // Update isExternal state when component mounts or user changes
  useEffect(() => {
    if (isExternalUser) {
      setIsExternal(true)
      formik.setFieldValue('isExternal', true)
    }
  }, [isExternalUser])

  const fetchMyBookings = async () => {
    try {
      const response = await fetch('/api/bookings/my-bookings')
      if (response.ok) {
        const data = await response.json()
        setBookings(data.bookings)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllBookings = async () => {
    try {
      // For regular users, fetch only approved bookings for calendar view
      // Use the main bookings endpoint which shows approved bookings for availability
      const response = await fetch('/api/bookings')
      if (response.ok) {
        const data = await response.json()
        // Show both approved and pending bookings for better availability visualization
        setAllBookings(data.bookings)
      } else {
        // If access denied, just show empty calendar
        setAllBookings([])
      }
    } catch (error) {
      console.error('Error fetching all bookings:', error)
      setAllBookings([])
    }
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleCreateBooking = () => {
    setEditBookingId(null)
    setFormError(null)
    formik.resetForm()
    setBookingFormOpen(true)
  }

  const handleEditBooking = (booking: Booking) => {
    setEditBookingId(booking._id)
    formik.setValues({
      eventName: booking.eventName,
      eventType: booking.eventType,
      eventDescription: booking.eventDescription,
      participantCount: booking.participantCount.toString(),
      startDateTime: new Date(booking.startTime),
      endDateTime: new Date(booking.endTime),
      instituteName: (booking as any).instituteName || '',
      coordinatorPhone: (booking as any).coordinatorPhone || '',
      extraTimePre: (booking as any).extraTimePre || 0,
      extraTimePost: (booking as any).extraTimePost || 0,
      specialRequirements: booking.specialRequirements || '',
      isExternal: (booking as any).isExternal || isExternalUser || false,
      externalBookingDetails: {
        refreshments: (booking as any).externalServices?.refreshments || false,
        transport: (booking as any).externalServices?.transport || false,
        hostel: (booking as any).externalServices?.hostel || false,
        mediaPhotoCoverage: (booking as any).externalServices?.mediaPhotoCoverage || false
      }
    })
    
    // Show warning for approved bookings
    if (booking.status === 'APPROVED' || booking.status === 'PARTIALLY_APPROVED') {
      setFormError('Note: Editing this approved booking will change its status to pending and require re-approval.')
    } else {
      setFormError(null)
    }
    
    setBookingFormOpen(true)
  }

  const handleDeleteBooking = async () => {
    if (!selectedBooking) return

    try {
      const response = await fetch(`/api/bookings/${selectedBooking._id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setBookings(bookings.filter(b => b._id !== selectedBooking._id))
        setDeleteDialogOpen(false)
        setSelectedBooking(null)
        await fetchAllBookings()
      }
    } catch (error) {
      console.error('Error deleting booking:', error)
    }
  }

  const handleCancelBooking = async () => {
    if (!selectedBooking) return

    try {
      const response = await fetch(`/api/bookings/${selectedBooking._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'CANCELLED'
        })
      })

      if (response.ok) {
        // Update the booking status in the local state
        setBookings(bookings.map(b => 
          b._id === selectedBooking._id 
            ? { ...b, status: 'CANCELLED' as const }
            : b
        ))
        setCancelDialogOpen(false)
        setSelectedBooking(null)
        await fetchAllBookings()
      } else {
        const data = await response.json()
        console.error('Error cancelling booking:', data.error)
      }
    } catch (error) {
      console.error('Error cancelling booking:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'success'
      case 'PENDING': return 'warning'
      case 'REJECTED': return 'error'
      case 'CANCELLED': return 'default'
      default: return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <ApprovedIcon />
      case 'PENDING': return <PendingIcon />
      case 'REJECTED': return <RejectedIcon />
      default: return <EventIcon />
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
  const BookingCard = ({ booking }: { booking: Booking }) => (
    <Paper 
      elevation={1} 
      sx={{ 
        p: { xs: 2, sm: 3 }, 
        mb: 2,
        border: '1px solid',
        borderColor: 'divider',
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(10px)'
      }}
    >
      <Stack spacing={2}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1} mr={2}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
              {booking.eventName}
            </Typography>
            <Chip 
              label={booking.eventType} 
              size="small"
              sx={{ 
                mt: 0.5,
                fontWeight: 500,
                background: alpha(theme.palette.secondary.main, 0.1),
                color: theme.palette.secondary.main,
                fontSize: '0.7rem'
              }}
            />
          </Box>
          <Chip
            icon={getStatusIcon(booking.status)}
            label={booking.status}
            color={getStatusColor(booking.status) as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
            size="small"
            sx={{ fontSize: '0.7rem', fontWeight: 500 }}
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
            <Typography variant="caption" color="textSecondary" display="block" sx={{ fontSize: '0.7rem' }}>
              Start Date & Time
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {formatDate(booking.startTime)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="textSecondary" display="block" sx={{ fontSize: '0.7rem' }}>
              End Date & Time
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {formatDate(booking.endTime)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="textSecondary" display="block" sx={{ fontSize: '0.7rem' }}>
              Participants
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {booking.participantCount}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="textSecondary" display="block" sx={{ fontSize: '0.7rem' }}>
              Institute/Organization
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {(booking as any).instituteName || 'N/A'}
            </Typography>
          </Box>
        </Box>

        {/* Description */}
        {booking.eventDescription && (
          <Box>
            <Typography variant="caption" color="textSecondary" display="block" sx={{ fontSize: '0.7rem' }}>
              Description
            </Typography>
            <Typography variant="body2" sx={{ 
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {booking.eventDescription}
            </Typography>
          </Box>
        )}

        {/* Rejection Reason */}
        {booking.status === 'REJECTED' && booking.rejectionReason && (
          <Box>
            <Typography variant="caption" color="error" display="block" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
              Rejection Reason
            </Typography>
            <Typography variant="body2" color="error" sx={{ 
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              fontStyle: 'italic'
            }}>
              {booking.rejectionReason}
            </Typography>
          </Box>
        )}

        {/* QR Code for Approved Bookings */}
        {booking.status === 'APPROVED' && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
            <QRCodeDisplay
              bookingId={booking._id}
              eventName={booking.eventName}
              startTime={booking.startTime}
              endTime={booking.endTime}
              eventType={booking.eventType}
              participantCount={booking.participantCount}
            />
          </Box>
        )}

        {/* Actions */}
        {(booking.status === 'PENDING' || booking.status === 'APPROVED' || booking.status === 'PARTIALLY_APPROVED') && (
          <>
            <Divider />
            <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap>
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => handleEditBooking(booking)}
                sx={{ 
                  fontSize: '0.75rem',
                  px: 2,
                  py: 0.5,
                  color: theme.palette.primary.main,
                  borderColor: theme.palette.primary.main,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                Edit
              </Button>
              
              {booking.status === 'PENDING' ? (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => {
                    setSelectedBooking(booking)
                    setDeleteDialogOpen(true)
                  }}
                  sx={{ 
                    fontSize: '0.75rem',
                    px: 2,
                    py: 0.5,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.error.main, 0.1),
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  Delete
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  startIcon={<CancelIcon />}
                  onClick={() => {
                    setSelectedBooking(booking)
                    setCancelDialogOpen(true)
                  }}
                  sx={{ 
                    fontSize: '0.75rem',
                    px: 2,
                    py: 0.5,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.warning.main, 0.1),
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  Cancel
                </Button>
              )}
            </Stack>
          </>
        )}
      </Stack>
    </Paper>
  )

  const calendarEvents: CalendarEvent[] = allBookings.map(booking => ({
    id: booking._id,
    title: `${booking.eventName} (${booking.userName})`,
    start: new Date(booking.startTime),
    end: new Date(booking.endTime),
    resource: booking
  }))

  const pendingCount = bookings.filter(b => b.status === 'PENDING').length
  const approvedCount = bookings.filter(b => b.status === 'APPROVED').length
  const rejectedCount = bookings.filter(b => b.status === 'REJECTED').length

  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." />
  }

  return (
    <PageTransition animationType="fade" delay={100}>
      <LocalizationProvider dateAdapter={AdapterMoment}>
        <Box sx={{ 
          minHeight: '100vh',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          pb: 4
        }}>
          <Container maxWidth="xl" sx={{ pt: { xs: 2, md: 4 }, px: { xs: 1, sm: 2, md: 3 } }}>
            {/* Enhanced Welcome Section */}
            <AnimatedSection animationType="slideUp" delay={200}>
              <Glassmorphism>
                <Box sx={{ 
                  p: { xs: 3, md: 4 }, 
                  mb: 4, 
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  color: 'white',
                  borderRadius: 3
                }}>
                  <Box display="flex" justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} flexDirection={{ xs: 'column', md: 'row' }} gap={2}>
                    <Box sx={{ mb: { xs: 2, md: 0 } }}>
                      <Typography variant="h3" gutterBottom sx={{ 
                        fontWeight: 700,
                        color: '#ffffff',
                        textShadow: '0 3px 6px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)',
                        fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' },
                        lineHeight: { xs: 1.2, md: 1.1 }
                      }}>
                        Welcome back, {session?.user?.name}! 
                        <Box component="span" sx={{ ml: 1, animation: 'wave 2s infinite' }}>👋</Box>
                      </Typography>
                      <Typography variant="h6" sx={{ 
                        color: '#ffffff',
                        textShadow: '0 2px 4px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.2)',
                        fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' }
                      }}>
                        Manage your auditorium bookings and view availability
                      </Typography>
                    </Box>
                    
                    {/* Action Buttons */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: { xs: 1, md: 2 }, 
                      flexWrap: 'wrap',
                      width: { xs: '100%', md: 'auto' },
                      justifyContent: { xs: 'center', md: 'flex-end' }
                    }}>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleCreateBooking}
                        sx={{ 
                          bgcolor: 'rgba(255,255,255,0.2)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          color: 'white',
                          py: { xs: 1, md: 1.5 },
                          px: { xs: 2, md: 3 },
                          fontSize: { xs: '0.8rem', md: '1rem' },
                          minWidth: { xs: '140px', sm: 'auto' },
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.3)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.3)'
                          },
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      >
                        Book Auditorium
                      </Button>
                      
                      {/* Admin Panel Button */}
                      {session?.user?.role === 'admin' && (
                        <Button
                          variant="contained"
                          startIcon={<AdminIcon />}
                          onClick={() => router.push('/admin')}
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.2)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            color: 'white',
                            py: { xs: 1, md: 1.5 },
                            px: { xs: 2, md: 3 },
                            fontSize: { xs: '0.8rem', md: '1rem' },
                            minWidth: { xs: '120px', sm: 'auto' },
                            '&:hover': {
                              bgcolor: 'rgba(255,255,255,0.3)',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 25px rgba(0,0,0,0.3)'
                            },
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
                        >
                          Admin Panel
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Glassmorphism>
            </AnimatedSection>

            {/* Enhanced Stats Cards */}
            <AnimatedSection animationType="slideUp" delay={400}>
              <StaggeredAnimation>
                <Grid container spacing={{ xs: 2, md: 3 }} mb={4}>
                  <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                    <Glassmorphism>
                      <Card sx={{ 
                        background: 'transparent',
                        border: 'none',
                        boxShadow: 'none',
                        height: '100%'
                      }}>
                        <CardContent sx={{ textAlign: 'center', p: { xs: 1.5, md: 2 } }}>
                          <Box sx={{
                            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                            borderRadius: '50%',
                            width: { xs: 50, sm: 60 },
                            height: { xs: 50, sm: 60 },
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: { xs: 1, md: 1.5 },
                            boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                          }}>
                            <EventIcon sx={{ fontSize: { xs: 24, sm: 30 }, color: 'white' }} />
                          </Box>
                          <Typography variant="h4" sx={{ 
                            fontWeight: 700, 
                            color: theme.palette.primary.main,
                            mb: 0.5,
                            fontSize: { xs: '1.5rem', sm: '2rem' }
                          }}>
                            {bookings.length}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ 
                            fontWeight: 500,
                            fontSize: { xs: '0.7rem', sm: '0.875rem' }
                          }}>
                            Total Bookings
                          </Typography>
                        </CardContent>
                      </Card>
                    </Glassmorphism>
                  </Grid>

                  <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                    <Glassmorphism>
                      <Card sx={{ 
                        background: 'transparent',
                        border: 'none',
                        boxShadow: 'none',
                        height: '100%'
                      }}>
                        <CardContent sx={{ textAlign: 'center', p: { xs: 1.5, md: 2 } }}>
                          <Box sx={{
                            background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.light})`,
                            borderRadius: '50%',
                            width: { xs: 50, sm: 60 },
                            height: { xs: 50, sm: 60 },
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: { xs: 1, md: 1.5 },
                            boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                          }}>
                            <ScheduleIcon sx={{ fontSize: { xs: 24, sm: 30 }, color: 'white' }} />
                          </Box>
                          <Typography variant="h4" sx={{ 
                            fontWeight: 700, 
                            color: theme.palette.warning.main,
                            mb: 0.5,
                            fontSize: { xs: '1.5rem', sm: '2rem' }
                          }}>
                            {pendingCount}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ 
                            fontWeight: 500,
                            fontSize: { xs: '0.7rem', sm: '0.875rem' }
                          }}>
                            Pending Approval
                          </Typography>
                        </CardContent>
                      </Card>
                    </Glassmorphism>
                  </Grid>

                  <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                    <Glassmorphism>
                      <Card sx={{ 
                        background: 'transparent',
                        border: 'none',
                        boxShadow: 'none',
                        height: '100%'
                      }}>
                        <CardContent sx={{ textAlign: 'center', p: { xs: 1.5, md: 2 } }}>
                          <Box sx={{
                            background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.light})`,
                            borderRadius: '50%',
                            width: { xs: 50, sm: 60 },
                            height: { xs: 50, sm: 60 },
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: { xs: 1, md: 1.5 },
                            boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                          }}>
                            <SecurityIcon sx={{ fontSize: { xs: 24, sm: 30 }, color: 'white' }} />
                          </Box>
                          <Typography variant="h4" sx={{ 
                            fontWeight: 700, 
                            color: theme.palette.success.main,
                            mb: 0.5,
                            fontSize: { xs: '1.5rem', sm: '2rem' }
                          }}>
                            {approvedCount}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ 
                            fontWeight: 500,
                            fontSize: { xs: '0.7rem', sm: '0.875rem' }
                          }}>
                            Approved
                          </Typography>
                        </CardContent>
                      </Card>
                    </Glassmorphism>
                  </Grid>

                  <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                    <Glassmorphism>
                      <Card sx={{ 
                        background: 'transparent',
                        border: 'none',
                        boxShadow: 'none',
                        height: '100%'
                      }}>
                        <CardContent sx={{ textAlign: 'center', p: { xs: 1.5, md: 2 } }}>
                          <Box sx={{
                            background: `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.light})`,
                            borderRadius: '50%',
                            width: { xs: 50, sm: 60 },
                            height: { xs: 50, sm: 60 },
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: { xs: 1, md: 1.5 },
                            boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                          }}>
                            <RejectedIcon sx={{ fontSize: { xs: 24, sm: 30 }, color: 'white' }} />
                          </Box>
                          <Typography variant="h4" sx={{ 
                            fontWeight: 700, 
                            color: theme.palette.error.main,
                            mb: 0.5,
                            fontSize: { xs: '1.5rem', sm: '2rem' }
                          }}>
                            {rejectedCount}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ 
                            fontWeight: 500,
                            fontSize: { xs: '0.7rem', sm: '0.875rem' }
                          }}>
                            Rejected
                          </Typography>
                        </CardContent>
                      </Card>
                    </Glassmorphism>
                  </Grid>
                </Grid>
              </StaggeredAnimation>
            </AnimatedSection>

            {/* Enhanced Calendar Section */}
            <AnimatedSection animationType="slideUp" delay={800}>
              <Glassmorphism>
                <Card sx={{ 
                  mb: 4,
                  background: 'transparent',
                  border: 'none',
                  boxShadow: 'none'
                }}>
                  <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    <Typography variant="h5" gutterBottom sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1.5,
                      fontWeight: 600,
                      color: theme.palette.primary.main,
                      fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
                      flexDirection: { xs: 'column', sm: 'row' },
                      textAlign: { xs: 'center', sm: 'left' }
                    }}>
                      <CalendarIcon sx={{ fontSize: { xs: 28, md: 32 } }} />
                      Auditorium Booking Calendar
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ 
                      mb: 2, 
                      fontSize: { xs: '0.9rem', md: '1rem' },
                      textAlign: { xs: 'center', sm: 'left' }
                    }}>
                      View availability and approved bookings. Click on any date to create a new booking.
                    </Typography>
                    
                    {/* Enhanced Availability Legend */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: { xs: 1, md: 2 }, 
                      mb: 2, 
                      justifyContent: 'center',
                      flexWrap: 'wrap'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ 
                          width: { xs: 12, md: 16 }, 
                          height: { xs: 12, md: 16 }, 
                          bgcolor: theme.palette.success.main, 
                          borderRadius: '50%',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }} />
                        <Typography variant="body2" sx={{ 
                          fontWeight: 500,
                          fontSize: { xs: '0.7rem', md: '0.875rem' }
                        }}>Available</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ 
                          width: { xs: 12, md: 16 }, 
                          height: { xs: 12, md: 16 }, 
                          bgcolor: theme.palette.warning.main, 
                          borderRadius: '50%',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }} />
                        <Typography variant="body2" sx={{ 
                          fontWeight: 500,
                          fontSize: { xs: '0.7rem', md: '0.875rem' }
                        }}>Pending Approval</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ 
                          width: { xs: 12, md: 16 }, 
                          height: { xs: 12, md: 16 }, 
                          bgcolor: theme.palette.error.main, 
                          borderRadius: '50%',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }} />
                        <Typography variant="body2" sx={{ 
                          fontWeight: 500,
                          fontSize: { xs: '0.7rem', md: '0.875rem' }
                        }}>Booked</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ 
                          width: 16, 
                          height: 16, 
                          bgcolor: '#9c27b0', 
                          borderRadius: '50%',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>Blocked by Admin</Typography>
                      </Box>
                    </Box>

                    <Paper sx={{ 
                      p: 1.5, 
                      height: 480,
                      borderRadius: 2,
                      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                      background: 'rgba(255,255,255,0.7)',
                      backdropFilter: 'blur(10px)',
                      overflow: 'hidden'
                    }}>
                      <AvailabilityCalendar 
                        bookings={allBookings}
                        onDateClick={(date) => {
                          // Open booking form with selected date
                          const startDateTime = new Date(date)
                          startDateTime.setHours(9, 0, 0, 0) // Default to 9 AM
                          const endDateTime = new Date(date)
                          endDateTime.setHours(10, 0, 0, 0) // Default to 10 AM
                          
                          formik.setFieldValue('startDateTime', startDateTime)
                          formik.setFieldValue('endDateTime', endDateTime)
                          setFormError(null)
                          setBookingFormOpen(true)
                        }}
                      />
                    </Paper>
                  </CardContent>
                </Card>
              </Glassmorphism>
            </AnimatedSection>

            {/* Enhanced Bookings Table */}
            <AnimatedSection animationType="slideUp" delay={1000}>
              <Glassmorphism>
                <Card sx={{
                  background: 'transparent',
                  border: 'none',
                  boxShadow: 'none'
                }}>
                  <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange}
                    sx={{ 
                      borderBottom: 1, 
                      borderColor: 'divider',
                      px: 2
                    }}
                  >
                    <Tab 
                      label="My Bookings" 
                      icon={<EventIcon />} 
                      sx={{ 
                        fontSize: '1rem',
                        fontWeight: 600,
                        textTransform: 'none'
                      }}
                    />
                  </Tabs>

                  {/* My Bookings Tab */}
                  <TabPanel value={tabValue} index={0}>
                    {bookings.length === 0 ? (
                      <Box textAlign="center" py={8}>
                        <Box sx={{
                          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
                          borderRadius: '50%',
                          width: 120,
                          height: 120,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 3
                        }}>
                          <EventIcon sx={{ fontSize: 64, color: theme.palette.primary.main }} />
                        </Box>
                        <Typography variant="h5" color="textSecondary" gutterBottom sx={{ fontWeight: 600 }}>
                          No bookings yet
                        </Typography>
                        <Typography variant="body1" color="textSecondary" mb={4} sx={{ fontSize: '1.1rem' }}>
                          Create your first auditorium booking to get started.
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={handleCreateBooking}
                          size="large"
                          sx={{
                            py: 2,
                            px: 4,
                            fontSize: '1.1rem',
                            borderRadius: 3,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 12px 35px rgba(0,0,0,0.25)'
                            }
                          }}
                        >
                          Create Your First Booking
                        </Button>
                      </Box>
                    ) : (
                      <>
                        {/* Mobile View - Cards */}
                        {isMobile ? (
                          <Box sx={{ px: { xs: 0, sm: 1 } }}>
                            {bookings.map((booking) => (
                              <BookingCard key={booking._id} booking={booking} />
                            ))}
                          </Box>
                        ) : (
                          /* Desktop View - Table */
                          <TableContainer sx={{ 
                            borderRadius: 2,
                            overflow: 'hidden',
                            background: 'rgba(255,255,255,0.7)',
                            backdropFilter: 'blur(10px)'
                          }}>
                            <Table>
                              <TableHead>
                                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                                  <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Event Name</TableCell>
                                  <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Type</TableCell>
                                  <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Date & Time</TableCell>
                                  <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Participants</TableCell>
                                  <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Status</TableCell>
                                  <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>QR Code</TableCell>
                                  <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Actions</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {bookings.map((booking) => (
                                  <TableRow 
                                    key={booking._id}
                                    sx={{
                                      '&:hover': {
                                        bgcolor: alpha(theme.palette.primary.main, 0.05)
                                      }
                                    }}
                                  >
                                    <TableCell>
                                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                        {booking.eventName}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Chip 
                                        label={booking.eventType} 
                                        size="small"
                                        sx={{ 
                                          fontWeight: 500,
                                          background: alpha(theme.palette.secondary.main, 0.1),
                                          color: theme.palette.secondary.main
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {formatDate(booking.startTime)}
                                      </Typography>
                                      <Typography variant="caption" color="textSecondary">
                                        to {formatDate(booking.endTime)}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography sx={{ fontWeight: 500 }}>
                                        {booking.participantCount}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Chip
                                        icon={getStatusIcon(booking.status)}
                                        label={booking.status}
                                        color={getStatusColor(booking.status) as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                                        size="small"
                                        sx={{ fontWeight: 500 }}
                                      />
                                      {booking.status === 'REJECTED' && booking.rejectionReason && (
                                        <Typography variant="caption" display="block" color="error" sx={{ mt: 1 }}>
                                          Reason: {booking.rejectionReason}
                                        </Typography>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {booking.status === 'APPROVED' && (
                                        <QRCodeDisplay
                                          bookingId={booking._id}
                                          eventName={booking.eventName}
                                          startTime={booking.startTime}
                                          endTime={booking.endTime}
                                          eventType={booking.eventType}
                                          participantCount={booking.participantCount}
                                        />
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {(booking.status === 'PENDING' || booking.status === 'APPROVED' || booking.status === 'PARTIALLY_APPROVED') && (
                                        <>
                                          <IconButton
                                            size="small"
                                            onClick={() => handleEditBooking(booking)}
                                            title={booking.status === 'APPROVED' || booking.status === 'PARTIALLY_APPROVED' ? 'Edit (will require re-approval)' : 'Edit booking'}
                                            sx={{
                                              color: theme.palette.primary.main,
                                              '&:hover': {
                                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                transform: 'scale(1.1)'
                                              }
                                            }}
                                          >
                                            <EditIcon />
                                          </IconButton>
                                          {booking.status === 'PENDING' ? (
                                            <IconButton
                                              size="small"
                                              onClick={() => {
                                                setSelectedBooking(booking)
                                                setDeleteDialogOpen(true)
                                              }}
                                              title="Delete booking"
                                              sx={{
                                                color: theme.palette.error.main,
                                                '&:hover': {
                                                  bgcolor: alpha(theme.palette.error.main, 0.1),
                                                  transform: 'scale(1.1)'
                                                }
                                              }}
                                            >
                                              <DeleteIcon />
                                            </IconButton>
                                          ) : (
                                            <IconButton
                                              size="small"
                                              onClick={() => {
                                                setSelectedBooking(booking)
                                                setCancelDialogOpen(true)
                                              }}
                                              title="Cancel booking"
                                              sx={{ 
                                                color: theme.palette.warning.main,
                                                '&:hover': {
                                                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                                                  transform: 'scale(1.1)'
                                                }
                                              }}
                                            >
                                              <CancelIcon />
                                            </IconButton>
                                          )}
                                        </>
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
                </Card>
              </Glassmorphism>
            </AnimatedSection>

        {/* Enhanced Booking Form Dialog */}
        <Dialog 
          open={bookingFormOpen} 
          onClose={() => setBookingFormOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px)'
            }
          }}
        >
          <form onSubmit={formik.handleSubmit}>
            <DialogTitle sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              color: 'white',
              fontSize: '1.5rem',
              fontWeight: 600
            }}>
              {editBookingId ? '✏️ Edit Booking' : '➕ New Booking Request'}
            </DialogTitle>
            <DialogContent sx={{ p: 4 }}>
              {formError && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 3,
                    borderRadius: 2,
                    '& .MuiAlert-icon': {
                      fontSize: '1.5rem'
                    }
                  }} 
                  onClose={() => setFormError(null)}
                >
                  {formError}
                </Alert>
              )}
              <Stack spacing={3} sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  name="eventName"
                  label="Event Name"
                  value={formik.values.eventName}
                  onChange={formik.handleChange}
                  error={formik.touched.eventName && Boolean(formik.errors.eventName)}
                  helperText={formik.touched.eventName && formik.errors.eventName}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
                
                <TextField
                  fullWidth
                  select
                  name="eventType"
                  label="Event Type"
                  value={formik.values.eventType}
                  onChange={formik.handleChange}
                  error={formik.touched.eventType && Boolean(formik.errors.eventType)}
                  helperText={formik.touched.eventType && formik.errors.eventType}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                >
                  {eventTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  fullWidth
                  name="instituteName"
                  label="Institute/Organization Name"
                  value={formik.values.instituteName}
                  onChange={formik.handleChange}
                  error={formik.touched.instituteName && Boolean(formik.errors.instituteName)}
                  helperText={formik.touched.instituteName && formik.errors.instituteName}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />

                <TextField
                  fullWidth
                  name="coordinatorPhone"
                  label="Coordinator Phone Number"
                  value={formik.values.coordinatorPhone}
                  onChange={formik.handleChange}
                  error={formik.touched.coordinatorPhone && Boolean(formik.errors.coordinatorPhone)}
                  helperText={formik.touched.coordinatorPhone && formik.errors.coordinatorPhone}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
                
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name="eventDescription"
                  label="Description"
                  value={formik.values.eventDescription}
                  onChange={formik.handleChange}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
                
                <TextField
                  fullWidth
                  type="number"
                  name="participantCount"
                  label="Number of Participants"
                  value={formik.values.participantCount}
                  onChange={formik.handleChange}
                  error={formik.touched.participantCount && Boolean(formik.errors.participantCount)}
                  helperText={formik.touched.participantCount && formik.errors.participantCount}
                  inputProps={{ 
                    min: 1,
                    max: 1000
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
                
                <DateTimePicker
                  label="Start Date & Time"
                  value={moment(formik.values.startDateTime)}
                  onChange={(value) => formik.setFieldValue('startDateTime', value?.toDate())}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: formik.touched.startDateTime && Boolean(formik.errors.startDateTime),
                      helperText: formik.touched.startDateTime && String(formik.errors.startDateTime),
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }
                    }
                  }}
                />
                
                <DateTimePicker
                  label="End Date & Time"
                  value={moment(formik.values.endDateTime)}
                  onChange={(value) => formik.setFieldValue('endDateTime', value?.toDate())}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: formik.touched.endDateTime && Boolean(formik.errors.endDateTime),
                      helperText: formik.touched.endDateTime && String(formik.errors.endDateTime),
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }
                    }
                  }}
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    type="number"
                    name="extraTimePre"
                    label="Extra Time Before (min)"
                    value={formik.values.extraTimePre}
                    onChange={formik.handleChange}
                    error={formik.touched.extraTimePre && Boolean(formik.errors.extraTimePre)}
                    helperText={formik.touched.extraTimePre && formik.errors.extraTimePre}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />

                  <TextField
                    fullWidth
                    type="number"
                    name="extraTimePost"
                    label="Extra Time After (min)"
                    value={formik.values.extraTimePost}
                    onChange={formik.handleChange}
                    error={formik.touched.extraTimePost && Boolean(formik.errors.extraTimePost)}
                    helperText={formik.touched.extraTimePost && formik.errors.extraTimePost}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                </Box>

                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  name="specialRequirements"
                  label="Special Requirements (Optional)"
                  value={formik.values.specialRequirements}
                  onChange={formik.handleChange}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      name="isExternal"
                      checked={formik.values.isExternal}
                      disabled={Boolean(isExternalUser)}
                      onChange={(e) => {
                        const isChecked = e.target.checked
                        formik.setFieldValue('isExternal', isChecked)
                        setIsExternal(isChecked)
                      }}
                      sx={{
                        '&.Mui-checked': {
                          color: theme.palette.secondary.main
                        }
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ fontWeight: 500 }}>
                      {isExternalUser 
                        ? "External Organization Booking (Auto-selected based on your email)" 
                        : "External Organization Booking"}
                    </Typography>
                  }
                />

                {formik.values.isExternal && (
                  <Box sx={{ 
                    border: `2px solid ${alpha(theme.palette.secondary.main, 0.3)}`, 
                    borderRadius: 3, 
                    p: 3,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.05)})`
                  }}>
                    <Typography variant="h6" gutterBottom sx={{ 
                      fontWeight: 700, 
                      mb: 2,
                      color: theme.palette.secondary.main,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      ⭐ Additional Services
                    </Typography>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="externalBookingDetails.refreshments"
                            checked={formik.values.externalBookingDetails.refreshments}
                            onChange={formik.handleChange}
                            sx={{
                              '&.Mui-checked': {
                                color: theme.palette.secondary.main
                              }
                            }}
                          />
                        }
                        label={<Typography sx={{ fontWeight: 500 }}>🍽️ Refreshments</Typography>}
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="externalBookingDetails.transport"
                            checked={formik.values.externalBookingDetails.transport}
                            onChange={formik.handleChange}
                            sx={{
                              '&.Mui-checked': {
                                color: theme.palette.secondary.main
                              }
                            }}
                          />
                        }
                        label={<Typography sx={{ fontWeight: 500 }}>🚌 Transport Facility</Typography>}
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="externalBookingDetails.hostel"
                            checked={formik.values.externalBookingDetails.hostel}
                            onChange={formik.handleChange}
                            sx={{
                              '&.Mui-checked': {
                                color: theme.palette.secondary.main
                              }
                            }}
                          />
                        }
                        label={<Typography sx={{ fontWeight: 500 }}>🏨 Hostel Facility</Typography>}
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="externalBookingDetails.mediaPhotoCoverage"
                            checked={formik.values.externalBookingDetails.mediaPhotoCoverage}
                            onChange={formik.handleChange}
                            sx={{
                              '&.Mui-checked': {
                                color: theme.palette.secondary.main
                              }
                            }}
                          />
                        }
                        label={<Typography sx={{ fontWeight: 500 }}>📸 Media & Photo Coverage</Typography>}
                      />
                    </FormGroup>
                    <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        💰 Booking fee: ₹50,000 (up to 2 hours) or ₹1,50,000 (full day)
                      </Typography>
                    </Alert>
                  </Box>
                )}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 3, gap: 2 }}>
              <Button 
                onClick={() => setBookingFormOpen(false)} 
                disabled={formSubmitting}
                sx={{
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: '1rem'
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                disabled={formSubmitting}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: '1rem',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                    transform: 'translateY(-1px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                  },
                  '&:disabled': {
                    opacity: 0.7
                  }
                }}
              >
                {formSubmitting ? '⏳ Submitting...' : (editBookingId ? '✅ Update Booking' : '🚀 Submit Request')}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Booking</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the booking &quot;{selectedBooking?.eventName}&quot;?
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeleteBooking} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Cancel Confirmation Dialog */}
        <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
          <DialogTitle>Cancel Booking</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to cancel the booking &quot;{selectedBooking?.eventName}&quot;?
              {selectedBooking?.status === 'APPROVED' && (
                <span>
                  <br /><br />
                  <strong>Note:</strong> This booking has been approved. Cancelling it will free up the time slot.
                </span>
              )}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelDialogOpen(false)}>
              Keep Booking
            </Button>
            <Button onClick={handleCancelBooking} color="warning" variant="contained">
              Cancel Booking
            </Button>
          </DialogActions>
        </Dialog>
          </Container>
        </Box>
      </LocalizationProvider>
    </PageTransition>
  )
}
