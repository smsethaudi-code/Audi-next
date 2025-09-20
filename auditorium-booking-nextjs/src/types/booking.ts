export type BookingStatus = 'PENDING' | 'PARTIALLY_APPROVED' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export interface ExternalServices {
  refreshments: boolean
  transport: boolean
  hostel: boolean
  mediaCoverage: boolean
}

export interface Booking {
  _id: string
  eventName: string
  eventType: string
  description: string
  expectedAttendees: number
  startTime: Date
  endTime: Date
  extraTimePre: number // minutes before event
  extraTimePost: number // minutes after event
  status: BookingStatus
  externalServices: ExternalServices
  qrCode?: string
  verificationCode?: string
  userId: string
  userName: string
  userEmail: string
  userRole: string
  approvedBy?: string
  approvedAt?: Date
  rejectionReason?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateBookingData {
  eventName: string
  eventType: string
  description: string
  expectedAttendees: number
  startTime: Date
  endTime: Date
  extraTimePre?: number
  extraTimePost?: number
  externalServices: ExternalServices
}

export interface UpdateBookingData {
  status?: BookingStatus
  approvedBy?: string
  rejectionReason?: string
}

export interface BookingConflict {
  hasConflict: boolean
  conflictingBookings: Booking[]
}

export interface TimeSlot {
  start: Date
  end: Date
  isBlocked: boolean
  blockedBy?: string
  reason?: string
}
