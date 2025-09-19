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
  Stack
} from '@mui/material'
import {
  Add as AddIcon,
  Event as EventIcon,
  Pending as PendingIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  QrCode as QrCodeIcon,
  CalendarMonth as CalendarIcon,
  AdminPanelSettings as AdminIcon,
  Cancel as CancelIcon
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
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
              setFormError(`⚠️ Time slot not available - conflicts with existing booking${conflictDetails}`)
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
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Welcome Section */}
        <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" gutterBottom>
              Welcome back, {session?.user?.name}!
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Manage your auditorium bookings and view availability.
            </Typography>
          </Box>
          
          {/* Admin Panel Button */}
          {session?.user?.role === 'admin' && (
            <Button
              variant="outlined"
              startIcon={<AdminIcon />}
              onClick={() => router.push('/admin')}
              color="secondary"
            >
              Admin Panel
            </Button>
          )}
        </Box>

        {/* Prominent Calendar Section */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon />
              Auditorium Booking Calendar
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              View availability and approved bookings. Hover over dates to see booking details.
            </Typography>
            
            {/* Availability Legend */}
            <Box sx={{ display: 'flex', gap: 3, mb: 3, justifyContent: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 16, bgcolor: '#4caf50', borderRadius: '50%' }} />
                <Typography variant="body2">Available</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 16, bgcolor: '#ff9800', borderRadius: '50%' }} />
                <Typography variant="body2">Pending Approval</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 16, bgcolor: '#f44336', borderRadius: '50%' }} />
                <Typography variant="body2">Booked</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 16, bgcolor: '#9c27b0', borderRadius: '50%' }} />
                <Typography variant="body2">Blocked by Admin</Typography>
              </Box>
            </Box>

            <Paper sx={{ p: 2, height: 600 }}>
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

        {/* Action Buttons */}
        <Box mb={3}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateBooking}
            sx={{ mr: 2 }}
            size="large"
          >
            Book Auditorium
          </Button>
          <Button
            variant="outlined"
            startIcon={<QrCodeIcon />}
            onClick={() => router.push('/verification')}
          >
            Verify Booking
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <EventIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography variant="h5">{bookings.length}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Bookings
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <PendingIcon color="warning" sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography variant="h5">{pendingCount}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Pending
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <ApprovedIcon color="success" sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography variant="h5">{approvedCount}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Approved
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <RejectedIcon color="error" sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography variant="h5">{rejectedCount}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Rejected
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs for detailed view */}
        <Card>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="My Bookings" icon={<EventIcon />} />
          </Tabs>

          {/* My Bookings Tab */}
          <TabPanel value={tabValue} index={0}>
            {bookings.length === 0 ? (
              <Box textAlign="center" py={4}>
                <EventIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  No bookings yet
                </Typography>
                <Typography variant="body2" color="textSecondary" mb={3}>
                  Create your first auditorium booking to get started.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateBooking}
                >
                  Create Booking
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Event Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Date & Time</TableCell>
                      <TableCell>Participants</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking._id}>
                        <TableCell>
                          <Typography variant="subtitle2">
                            {booking.eventName}
                          </Typography>
                        </TableCell>
                        <TableCell>{booking.eventType}</TableCell>
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
                            icon={getStatusIcon(booking.status)}
                            label={booking.status}
                            color={getStatusColor(booking.status) as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                            size="small"
                          />
                          {booking.status === 'REJECTED' && booking.rejectionReason && (
                            <Typography variant="caption" display="block" color="error">
                              Reason: {booking.rejectionReason}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {(booking.status === 'PENDING' || booking.status === 'APPROVED' || booking.status === 'PARTIALLY_APPROVED') && (
                            <>
                              <IconButton
                                size="small"
                                onClick={() => handleEditBooking(booking)}
                                title={booking.status === 'APPROVED' || booking.status === 'PARTIALLY_APPROVED' ? 'Edit (will require re-approval)' : 'Edit booking'}
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
                                  sx={{ color: 'warning.main' }}
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
          </TabPanel>
        </Card>

        {/* Enhanced Booking Form Dialog */}
        <Dialog 
          open={bookingFormOpen} 
          onClose={() => setBookingFormOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <form onSubmit={formik.handleSubmit}>
            <DialogTitle>{editBookingId ? 'Edit Booking' : 'New Booking Request'}</DialogTitle>
            <DialogContent>
              {formError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError(null)}>
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
                />

                <TextField
                  fullWidth
                  name="coordinatorPhone"
                  label="Coordinator Phone Number"
                  value={formik.values.coordinatorPhone}
                  onChange={formik.handleChange}
                  error={formik.touched.coordinatorPhone && Boolean(formik.errors.coordinatorPhone)}
                  helperText={formik.touched.coordinatorPhone && formik.errors.coordinatorPhone}
                />
                
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name="eventDescription"
                  label="Description"
                  value={formik.values.eventDescription}
                  onChange={formik.handleChange}
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
                />
                
                <DateTimePicker
                  label="Start Date & Time"
                  value={moment(formik.values.startDateTime)}
                  onChange={(value) => formik.setFieldValue('startDateTime', value?.toDate())}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: formik.touched.startDateTime && Boolean(formik.errors.startDateTime),
                      helperText: formik.touched.startDateTime && String(formik.errors.startDateTime)
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
                      helperText: formik.touched.endDateTime && String(formik.errors.endDateTime)
                    }
                  }}
                />

                <TextField
                  fullWidth
                  type="number"
                  name="extraTimePre"
                  label="Extra Time Before Event (minutes)"
                  value={formik.values.extraTimePre}
                  onChange={formik.handleChange}
                  error={formik.touched.extraTimePre && Boolean(formik.errors.extraTimePre)}
                  helperText={formik.touched.extraTimePre && formik.errors.extraTimePre}
                />

                <TextField
                  fullWidth
                  type="number"
                  name="extraTimePost"
                  label="Extra Time After Event (minutes)"
                  value={formik.values.extraTimePost}
                  onChange={formik.handleChange}
                  error={formik.touched.extraTimePost && Boolean(formik.errors.extraTimePost)}
                  helperText={formik.touched.extraTimePost && formik.errors.extraTimePost}
                />

                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  name="specialRequirements"
                  label="Special Requirements (Optional)"
                  value={formik.values.specialRequirements}
                  onChange={formik.handleChange}
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
                    />
                  }
                  label={
                    isExternalUser 
                      ? "External Organization Booking (Auto-selected based on your email)" 
                      : "External Organization Booking"
                  }
                />

                {formik.values.isExternal && (
                  <Box sx={{ 
                    border: '1px solid #e0e0e0', 
                    borderRadius: 1, 
                    p: 2,
                    bgcolor: '#f5f5f5'
                  }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                      Additional Services
                    </Typography>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="externalBookingDetails.refreshments"
                            checked={formik.values.externalBookingDetails.refreshments}
                            onChange={formik.handleChange}
                          />
                        }
                        label="Refreshments"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="externalBookingDetails.transport"
                            checked={formik.values.externalBookingDetails.transport}
                            onChange={formik.handleChange}
                          />
                        }
                        label="Transport Facility"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="externalBookingDetails.hostel"
                            checked={formik.values.externalBookingDetails.hostel}
                            onChange={formik.handleChange}
                          />
                        }
                        label="Hostel Facility"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="externalBookingDetails.mediaPhotoCoverage"
                            checked={formik.values.externalBookingDetails.mediaPhotoCoverage}
                            onChange={formik.handleChange}
                          />
                        }
                        label="Media & Photo Coverage"
                      />
                    </FormGroup>
                    <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                      * Booking fee: ₹50,000 (up to 2 hours) or ₹1,50,000 (full day)
                    </Typography>
                  </Box>
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setBookingFormOpen(false)} disabled={formSubmitting}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                disabled={formSubmitting}
              >
                {formSubmitting ? 'Submitting...' : (editBookingId ? 'Update' : 'Submit Request')}
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
    </LocalizationProvider>
  )
}
