/**
 * Utility functions for common operations
 */

export function generateVerificationCode(bookingId: string): string {
  const timestamp = Date.now().toString(36)
  return `BK-${bookingId.slice(-6).toUpperCase()}-${timestamp.toUpperCase()}`
}

export function isValidTimeSlot(startTime: Date, endTime: Date): boolean {
  const now = new Date()
  const start = new Date(startTime)
  const end = new Date(endTime)

  console.log('Time validation:', {
    now: now.toISOString(),
    start: start.toISOString(),
    end: end.toISOString(),
    startHour: start.getHours(),
    endHour: end.getHours()
  })

  // Check if start time is in the future (allow some buffer for processing time)
  const oneMinuteAgo = new Date(now.getTime() - 60000) // 1 minute buffer
  if (start <= oneMinuteAgo) {
    console.log('Validation failed: Start time is not in the future')
    return false
  }

  // Check if end time is after start time
  if (end <= start) {
    console.log('Validation failed: End time is not after start time')
    return false
  }

  // Check if booking starts within business hours (8 AM to 10 PM)
  // End time can go up to 11 PM (22:59) to allow events that end at 10 PM
  const startHour = start.getHours()
  const endHour = end.getHours()
  const endMinute = end.getMinutes()

  if (startHour < 8 || startHour >= 22) {
    console.log('Validation failed: Start time outside business hours (8 AM - 10 PM)')
    return false
  }

  // Allow end time up to 11 PM (23:00) to accommodate events ending at 10 PM
  if (endHour > 23 || (endHour === 23 && endMinute > 0)) {
    console.log('Validation failed: End time too late (after 11 PM)')
    return false
  }

  // Check if duration is reasonable (max 12 hours)
  const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  if (durationHours > 12) {
    console.log('Validation failed: Duration exceeds 12 hours')
    return false
  }

  // Minimum duration check (at least 30 minutes)
  if (durationHours < 0.5) {
    console.log('Validation failed: Duration less than 30 minutes')
    return false
  }

  console.log('Time validation passed')
  return true
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) {
    return `${mins} minutes`
  }

  if (mins === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`
  }

  return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes`
}

export function getTimeSlots(date: Date): { start: Date; end: Date; label: string }[] {
  const slots = []
  const baseDate = new Date(date)
  baseDate.setHours(8, 0, 0, 0) // Start at 8 AM

  for (let hour = 8; hour < 22; hour++) {
    const start = new Date(baseDate)
    start.setHours(hour, 0, 0, 0)

    const end = new Date(baseDate)
    end.setHours(hour + 1, 0, 0, 0)

    slots.push({
      start,
      end,
      label: `${hour.toString().padStart(2, '0')}:00 - ${(hour + 1).toString().padStart(2, '0')}:00`
    })
  }

  return slots
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6 // Sunday or Saturday
}

export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date)
  let addedDays = 0

  while (addedDays < days) {
    result.setDate(result.getDate() + 1)
    if (!isWeekend(result)) {
      addedDays++
    }
  }

  return result
}

export function parseTimeString(timeString: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeString.split(':').map(Number)
  return { hours: hours || 0, minutes: minutes || 0 }
}

export function formatTimeString(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

export function formatDateString(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function getDateRange(startDate: Date, endDate: Date): Date[] {
  const dates = []
  const current = new Date(startDate)

  while (current <= endDate) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  return dates
}
