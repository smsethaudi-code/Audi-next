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
  Pagination,
  Stack
} from '@mui/material'
import {
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Schedule as PartialApproveIcon,
  Cancel as RejectIcon,
  Block as BlockIcon,
  History as HistoryIcon,
  Event as EventIcon,
  Pending as PendingIcon
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

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
  const { data: session } = useSession()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [blockedSlots, setBlockedSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tabValue, setTabValue] = useState(0)
  
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalBookings, setTotalBookings] = useState(0)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('ALL') // ALL, UPCOMING, PAST
  
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    type: 'approve' | 'partial-approve' | 'reject' | 'view' | 'cancel' | null
    booking: Booking | null
  }>({ open: false, type: null, booking: null })
  const [rejectionReason, setRejectionReason] = useState('')
  const [cancellationReason, setCancellationReason] = useState('')
  const [blockTimeDialog, setBlockTimeDialog] = useState(false)
  const [blockTimeData, setBlockTimeData] = useState({
    startTime: '',
    endTime: '',
    reason: ''
  })

  useEffect(() => {
    fetchBookings()
  }, [currentPage, pageSize, statusFilter, dateFilter])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      
      // Build query parameters for pagination and filtering
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString()
      })
      
      if (statusFilter !== 'ALL' && statusFilter !== 'BLOCKED') {
        params.append('status', statusFilter)
      }
      
      // Fetch bookings with pagination
      const bookingsResponse = await fetch(`/api/admin/bookings?${params}`)
      let allFetchedBookings: any[] = []
      let totalCount = 0
      
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json()
        allFetchedBookings = [...bookingsData.bookings]
        totalCount = bookingsData.pagination?.total || 0
      }

      // Fetch blocked time slots if needed
      const blockedResponse = await fetch('/api/bookings/block')
      let blockedSlots: any[] = []
      if (blockedResponse.ok) {
        const blockedData = await blockedResponse.json()
        blockedSlots = blockedData.blockedSlots || []
        setBlockedSlots(blockedSlots)
        
        // Include blocked slots in the display if filter allows
        if (statusFilter === 'ALL' || statusFilter === 'BLOCKED') {
          const transformedBlockedSlots = blockedSlots.map((slot: any) => ({
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
          
          if (statusFilter === 'BLOCKED') {
            // Show only blocked slots
            allFetchedBookings = transformedBlockedSlots
            totalCount = transformedBlockedSlots.length
          } else {
            // Show both bookings and blocked slots
            allFetchedBookings = [...allFetchedBookings, ...transformedBlockedSlots]
            totalCount += transformedBlockedSlots.length
          }
        }
      }
      
      // Apply date filter on the client side
      let filteredBookings = allFetchedBookings
      if (dateFilter === 'UPCOMING') {
        const now = new Date()
        filteredBookings = allFetchedBookings.filter((booking: any) => 
          new Date(booking.startTime) > now
        )
      } else if (dateFilter === 'PAST') {
        const now = new Date()
        filteredBookings = allFetchedBookings.filter((booking: any) => 
          new Date(booking.startTime) < now
        )
      }
      
      // Sort by start time
      filteredBookings.sort((a: any, b: any) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )
      
      setBookings(filteredBookings)
      setTotalBookings(filteredBookings.length)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'success'
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

  const pendingBookings = bookings.filter(b => b.status === 'PENDING' || b.status === 'PARTIALLY_APPROVED')
  const partiallyApprovedBookings = bookings.filter(b => b.status === 'PARTIALLY_APPROVED')
  
  // Transform blocked slots to match booking structure for display
  const transformedBlockedSlots = blockedSlots.map(slot => ({
    _id: slot._id,
    eventName: `🚫 BLOCKED: ${slot.reason}`,
    eventType: 'Time Block',
    eventDescription: slot.reason,
    userName: slot.blockedByName || 'Admin',
    userEmail: 'N/A',
    startTime: slot.startTime,
    endTime: slot.endTime,
    status: 'BLOCKED',
    createdAt: slot.createdAt,
    participantCount: 0,
    isBlockedSlot: true,
    originalBlockedSlot: slot,
    // Add missing required fields
    rejectionReason: '',
    specialRequirements: '',
    instituteName: 'N/A',
    coordinatorPhone: 'N/A',
    extraTimePre: 0,
    extraTimePost: 0,
    isExternal: false,
    totalCost: 0,
    externalServices: {}
  } as any))
  
  // Combine bookings and blocked slots, sorted by start time
  const allBookings = [...bookings, ...transformedBlockedSlots].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )
  
  const approvedBookings = bookings.filter(b => b.status === 'APPROVED')
  const rejectedBookings = bookings.filter(b => b.status === 'REJECTED' || b.status === 'CANCELLED')

  if (loading) {
    return <LoadingSpinner message="Loading admin dashboard..." />
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Manage auditorium bookings, approve requests, and block time slots.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PendingIcon color="warning" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h5">{pendingBookings.length}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Pending & Partial
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PartialApproveIcon color="info" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h5">{partiallyApprovedBookings.length}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Partially Approved
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ApproveIcon color="success" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h5">{approvedBookings.length}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Approved
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <RejectIcon color="error" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h5">{rejectedBookings.length}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Rejected & Cancelled
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <EventIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h5">{allBookings.length}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Bookings
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box mb={3}>
        <Button
          variant="contained"
          startIcon={<BlockIcon />}
          onClick={() => setBlockTimeDialog(true)}
          sx={{ mr: 2 }}
        >
          Block Time Slot
        </Button>
      </Box>

      {/* Tabs */}
      <Card>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label={`Pending & Partial (${pendingBookings.length})`} />
          <Tab label={`All Bookings (${totalBookings})`} />
          <Tab label="Booking History" />
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
        </TabPanel>

        {/* All Bookings Tab */}
        <TabPanel value={tabValue} index={1}>
          {/* Filter Controls */}
          <Box sx={{ mb: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status Filter"
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setCurrentPage(1) // Reset to first page when filter changes
                  }}
                >
                  <MenuItem value="ALL">All Statuses</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="PARTIALLY_APPROVED">Partially Approved</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                  <MenuItem value="BLOCKED">Blocked by Admin</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Date Filter</InputLabel>
                <Select
                  value={dateFilter}
                  label="Date Filter"
                  onChange={(e) => {
                    setDateFilter(e.target.value)
                    setCurrentPage(1) // Reset to first page when filter changes
                  }}
                >
                  <MenuItem value="ALL">All Dates</MenuItem>
                  <MenuItem value="UPCOMING">Upcoming</MenuItem>
                  <MenuItem value="PAST">Past</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Page Size</InputLabel>
                <Select
                  value={pageSize}
                  label="Page Size"
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1) // Reset to first page when page size changes
                  }}
                >
                  <MenuItem value={5}>5 per page</MenuItem>
                  <MenuItem value={10}>10 per page</MenuItem>
                  <MenuItem value={20}>20 per page</MenuItem>
                  <MenuItem value={50}>50 per page</MenuItem>
                </Select>
              </FormControl>
              
              <Typography variant="body2" color="textSecondary">
                Showing {Math.min((currentPage - 1) * pageSize + 1, totalBookings)} to {Math.min(currentPage * pageSize, totalBookings)} of {totalBookings} bookings
              </Typography>
            </Stack>
          </Box>

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
                {bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No bookings found matching the current filters.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings.map((booking) => (
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

          {/* Pagination */}
          {totalBookings > 0 && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                Total: {totalBookings} bookings
              </Typography>
              <Pagination
                count={Math.ceil(totalBookings / pageSize)}
                page={currentPage}
                onChange={(event, page) => setCurrentPage(page)}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </TabPanel>

        {/* Booking History Tab */}
        <TabPanel value={tabValue} index={2}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Historical bookings and analytics will be displayed here.
          </Alert>
        </TabPanel>
      </Card>

      {/* Action Dialogs */}
      <Dialog 
        open={actionDialog.open} 
        onClose={() => setActionDialog({ open: false, type: null, booking: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {actionDialog.type === 'approve' && 
            (actionDialog.booking?.status === 'PARTIALLY_APPROVED' ? 
              'Full Approval (Payment Received)' : 'Approve Booking')}
          {actionDialog.type === 'partial-approve' && 'Partial Approval (Pending Payment)'}
          {actionDialog.type === 'reject' && 'Reject Booking'}
          {actionDialog.type === 'cancel' && 'Cancel Approved Booking'}
          {actionDialog.type === 'view' && 'Booking Details'}
        </DialogTitle>
        <DialogContent>
          {actionDialog.booking && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {actionDialog.booking.eventName}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Event Type</Typography>
                  <Typography variant="body1">{actionDialog.booking.eventType}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Organizer</Typography>
                  <Typography variant="body1">{actionDialog.booking.userName}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Email</Typography>
                  <Typography variant="body1">{actionDialog.booking.userEmail}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Participants</Typography>
                  <Typography variant="body1">{actionDialog.booking.participantCount}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Start Time</Typography>
                  <Typography variant="body1">{formatDate(actionDialog.booking.startTime)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">End Time</Typography>
                  <Typography variant="body1">{formatDate(actionDialog.booking.endTime)}</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" color="textSecondary">Description</Typography>
                  <Typography variant="body1">{actionDialog.booking.eventDescription}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="textSecondary">Status</Typography>
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
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="textSecondary">Created At</Typography>
                  <Typography variant="body1">{formatDate(actionDialog.booking.createdAt)}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="textSecondary">Institute Name</Typography>
                  <Typography variant="body1">{(actionDialog.booking as any).instituteName || 'N/A'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="textSecondary">Coordinator Phone</Typography>
                  <Typography variant="body1">{(actionDialog.booking as any).coordinatorPhone || 'N/A'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="textSecondary">Extra Time Before (mins)</Typography>
                  <Typography variant="body1">{(actionDialog.booking as any).extraTimePre || 0}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="textSecondary">Extra Time After (mins)</Typography>
                  <Typography variant="body1">{(actionDialog.booking as any).extraTimePost || 0}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="textSecondary">External Event</Typography>
                  <Typography variant="body1">{(actionDialog.booking as any).isExternal ? 'Yes' : 'No'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="textSecondary">Total Cost</Typography>
                  <Typography variant="body1">₹{(actionDialog.booking as any).totalCost || 0}</Typography>
                </Grid>
                
                {/* External Services */}
                {(actionDialog.booking as any).externalServices && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>External Services</Typography>
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
                  </Grid>
                )}

                {/* Approval Details */}
                {actionDialog.booking.status === 'APPROVED' && (actionDialog.booking as any).approvedAt && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="textSecondary">Approved At</Typography>
                    <Typography variant="body1">{formatDate((actionDialog.booking as any).approvedAt)}</Typography>
                  </Grid>
                )}
                
                {/* Rejection Details */}
                {actionDialog.booking.status === 'REJECTED' && actionDialog.booking.rejectionReason && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" color="textSecondary">Rejection Reason</Typography>
                    <Typography variant="body1" color="error">{actionDialog.booking.rejectionReason}</Typography>
                  </Grid>
                )}

                {/* Cancellation Details */}
                {actionDialog.booking.status === 'CANCELLED' && actionDialog.booking.rejectionReason && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" color="textSecondary">Cancellation Reason</Typography>
                    <Typography variant="body1" color="error">{actionDialog.booking.rejectionReason}</Typography>
                  </Grid>
                )}

                {actionDialog.booking.specialRequirements && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" color="textSecondary">Special Requirements</Typography>
                    <Typography variant="body1">{actionDialog.booking.specialRequirements}</Typography>
                  </Grid>
                )}
              </Grid>

              {actionDialog.type === 'reject' && (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Rejection Reason (Optional)"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  sx={{ mt: 2 }}
                />
              )}

              {actionDialog.type === 'cancel' && (
                <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
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
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog({ open: false, type: null, booking: null })}>
            Cancel
          </Button>
          {actionDialog.type === 'partial-approve' && (
            <Button onClick={() => handleBookingAction('partial-approve')} color="warning" variant="contained">
              Partial Approve (Pending Payment)
            </Button>
          )}
          {actionDialog.type === 'approve' && (
            <Button onClick={() => handleBookingAction('approve')} color="success" variant="contained">
              {actionDialog.booking?.status === 'PARTIALLY_APPROVED' ? 'Full Approve (Payment Received)' : 'Approve'}
            </Button>
          )}
          {actionDialog.type === 'reject' && (
            <Button onClick={() => handleBookingAction('reject')} color="error" variant="contained">
              Reject
            </Button>
          )}
          {actionDialog.type === 'cancel' && (
            <Button 
              onClick={() => handleBookingAction('cancel')} 
              color="error" 
              variant="contained"
              disabled={!cancellationReason.trim()}
            >
              Cancel Booking
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Block Time Dialog */}
      <Dialog open={blockTimeDialog} onClose={() => setBlockTimeDialog(false)}>
        <DialogTitle>Block Time Slot</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Start Time"
                value={blockTimeData.startTime}
                onChange={(e) => setBlockTimeData({ ...blockTimeData, startTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="datetime-local"
                label="End Time"
                value={blockTimeData.endTime}
                onChange={(e) => setBlockTimeData({ ...blockTimeData, endTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Reason for Blocking"
                value={blockTimeData.reason}
                onChange={(e) => setBlockTimeData({ ...blockTimeData, reason: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBlockTimeDialog(false)}>Cancel</Button>
          <Button onClick={handleBlockTime} variant="contained">
            Block Time
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}