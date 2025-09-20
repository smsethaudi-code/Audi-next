'use client'

import { useState } from 'react'
import {
  Box,
  Grid,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material'
import {
  ChevronLeft,
  ChevronRight
} from '@mui/icons-material'
import moment from 'moment'

interface Booking {
  _id: string
  eventName: string
  startTime: string
  endTime: string
  status: string
}

interface AvailabilityCalendarProps {
  bookings: Booking[]
  onDateClick?: (date: Date) => void
}

export default function AvailabilityCalendar({ bookings, onDateClick }: AvailabilityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const today = new Date()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Get first day of month and how many days in month
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay() // 0 = Sunday

  // Generate calendar days
  const calendarDays = []
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(month - 1)
    } else {
      newDate.setMonth(month + 1)
    }
    setCurrentDate(newDate)
  }

  const getBookingsForDate = (day: number) => {
    const date = new Date(year, month, day)
    const dayStart = moment(date).startOf('day')
    const dayEnd = moment(date).endOf('day')
    
    return bookings.filter(booking => {
      const bookingStart = moment(booking.startTime)
      return bookingStart.isBetween(dayStart, dayEnd, 'day', '[]')
    })
  }

  const getDateStatus = (day: number) => {
    const dayBookings = getBookingsForDate(day)
    if (dayBookings.length === 0) return 'available'
    
    const hasBlocked = dayBookings.some(b => b.status === 'BLOCKED')
    const hasApproved = dayBookings.some(b => b.status === 'APPROVED')
    const hasPending = dayBookings.some(b => b.status === 'PENDING')
    
    if (hasBlocked) return 'blocked'
    if (hasApproved) return 'booked'
    if (hasPending) return 'pending'
    return 'available'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#4caf50'
      case 'pending': return '#ff9800'
      case 'booked': return '#f44336'
      case 'blocked': return '#9c27b0' // Purple for admin blocked
      default: return '#e0e0e0'
    }
  }

  const formatBookingTooltip = (bookings: Booking[]) => {
    if (bookings.length === 0) return 'Available for booking'
    
    return bookings.map(booking => 
      `${moment(booking.startTime).format('h:mm A')} - ${moment(booking.endTime).format('h:mm A')} (${booking.status})`
    ).join('\n')
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <Paper sx={{ p: 1.5 }}>
      {/* Calendar Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <IconButton onClick={() => navigateMonth('prev')}>
          <ChevronLeft />
        </IconButton>
        
        <Typography variant="h5" fontWeight="bold">
          {moment(currentDate).format('MMMM YYYY')}
        </Typography>
        
        <IconButton onClick={() => navigateMonth('next')}>
          <ChevronRight />
        </IconButton>
      </Box>

      {/* Calendar Grid */}
      <Grid container spacing={1}>
        {/* Week day headers */}
        {weekDays.map(day => (
          <Grid key={day} size={{ xs: 12/7 }}>
            <Box textAlign="center" py={1}>
              <Typography variant="body2" fontWeight="bold" color="textSecondary">
                {day}
              </Typography>
            </Box>
          </Grid>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          if (day === null) {
            return (
              <Grid key={`empty-${index}`} size={{ xs: 12/7 }}>
                <Box height={50} />
              </Grid>
            )
          }

          const dayBookings = getBookingsForDate(day)
          const status = getDateStatus(day)
          const isToday = today.getDate() === day && 
                         today.getMonth() === month && 
                         today.getFullYear() === year

          return (
            <Grid key={day} size={{ xs: 12/7 }}>
              <Tooltip 
                title={formatBookingTooltip(dayBookings)}
                placement="top"
                arrow
              >
                <Paper
                  elevation={isToday ? 3 : 1}
                  sx={{
                    height: 50,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    border: isToday ? '2px solid #1976d2' : 'none',
                    position: 'relative',
                    '&:hover': {
                      elevation: 3,
                      transform: 'scale(1.05)'
                    }
                  }}
                  onClick={() => onDateClick?.(new Date(year, month, day))}
                >
                  <Typography variant="body1" fontWeight={isToday ? 'bold' : 'normal'}>
                    {day}
                  </Typography>
                  
                  {/* Status indicator */}
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: getStatusColor(status),
                      mt: 0.5
                    }}
                  />
                  
                  {/* Booking count indicator */}
                  {dayBookings.length > 0 && (
                    <Chip
                      label={dayBookings.length}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        height: 16,
                        fontSize: '10px',
                        backgroundColor: getStatusColor(status),
                        color: 'white'
                      }}
                    />
                  )}
                </Paper>
              </Tooltip>
            </Grid>
          )
        })}
      </Grid>
    </Paper>
  )
}