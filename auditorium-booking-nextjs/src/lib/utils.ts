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

  // Check if start time is in the future
  if (start <= now) {
    return false
  }

  // Check if end time is after start time
  if (end <= start) {
    return false
  }

  // Check if booking is within business hours (8 AM to 10 PM)
  const startHour = start.getHours()
  const endHour = end.getHours()

  if (startHour < 8 || endHour > 22) {
    return false
  }

  // Check if duration is reasonable (max 12 hours)
  const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  if (durationHours > 12) {
    return false
  }

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