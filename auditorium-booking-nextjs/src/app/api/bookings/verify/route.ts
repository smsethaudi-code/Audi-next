import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import connectDB from '@/lib/db'
import Booking from '@/models/Booking'
import { logger, checkRateLimit, validate, sanitizeApiResponse } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      logger.warn('Unauthorized verification attempt')
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting - 20 requests per minute per user
    const userIdentifier = session.user.id || session.user.email || 'anonymous'
    if (!checkRateLimit(`verify_${userIdentifier}`, 20, 60000)) {
      logger.warn('Rate limit exceeded for verification', { user: userIdentifier })
      return NextResponse.json({ 
        success: false, 
        message: 'Too many requests. Please try again later.' 
      }, { status: 429 })
    }

    await connectDB()

    const body = await request.json()
    const { bookingId, verificationCode, action = 'validate' } = body

    // Input validation
    if (!bookingId || !verificationCode) {
      logger.warn('Missing required fields in verification request')
      return NextResponse.json({ 
        success: false, 
        message: 'Booking ID and verification code are required' 
      }, { status: 400 })
    }

    if (!validate.mongoId(bookingId)) {
      logger.warn('Invalid booking ID format', { bookingId })
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid booking ID format' 
      }, { status: 400 })
    }

    // Find the booking by ID
    const booking = await Booking.findById(bookingId)

    if (!booking) {
      logger.warn('Booking not found for verification', { bookingId })
      return NextResponse.json({ 
        success: false, 
        message: 'Booking not found' 
      }, { status: 404 })
    }

    // Check if booking is approved
    if (booking.status !== 'APPROVED') {
      logger.warn('Verification attempt on non-approved booking', { 
        bookingId, 
        status: booking.status 
      })
      return NextResponse.json({ 
        success: false, 
        message: `Cannot verify booking with status: ${booking.status}. Only approved bookings can be verified.` 
      }, { status: 400 })
    }

    // Generate expected verification code (same logic as QR generation)
    const expectedCode = `${booking._id}-${booking.eventName}-${new Date(booking.startTime).getTime()}`
    const expectedHash = Buffer.from(expectedCode).toString('base64')

    // Verify the code
    if (verificationCode !== expectedHash) {
      logger.warn('Invalid verification code provided', { bookingId })
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid verification code' 
      }, { status: 400 })
    }

    // Check if verification is happening on the event day or within reasonable time
    const eventDate = new Date(booking.startTime)
    const currentDate = new Date()
    const daysDifference = Math.abs((currentDate.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24))

    // Allow verification 1 day before and 1 day after the event
    if (daysDifference > 1) {
      logger.warn('Verification attempt outside allowed time window', { 
        bookingId, 
        daysDifference 
      })
      return NextResponse.json({ 
        success: false, 
        message: `Verification can only be done within 1 day of the event date (${eventDate.toLocaleDateString()})` 
      }, { status: 400 })
    }

    // If action is just validation, return booking info without updating
    if (action === 'validate') {
      const sanitizedBooking = sanitizeApiResponse({
        id: booking._id,
        eventName: booking.eventName,
        eventType: booking.eventType,
        userName: booking.userName,
        startTime: booking.startTime,
        endTime: booking.endTime,
        participantCount: booking.participantCount,
        status: booking.status
      })

      logger.info('Booking validation successful', { bookingId })
      return NextResponse.json({
        success: true,
        message: 'QR code is valid',
        booking: sanitizedBooking
      })
    }

    // If action is verify and user is admin, update status to verified
    if (action === 'verify') {
      if (session.user?.role !== 'admin') {
        logger.warn('Non-admin attempted to verify booking', { 
          bookingId, 
          userRole: session.user?.role 
        })
        return NextResponse.json({ 
          success: false, 
          message: 'Admin access required to verify bookings' 
        }, { status: 403 })
      }

      // Check if already verified
      if (booking.verifiedAt) {
        logger.warn('Attempt to verify already verified booking', { bookingId })
        return NextResponse.json({ 
          success: false, 
          message: 'Booking has already been verified',
          booking: sanitizeApiResponse({
            id: booking._id,
            eventName: booking.eventName,
            verifiedAt: booking.verifiedAt,
            verifiedBy: booking.verifiedBy
          })
        }, { status: 400 })
      }

      // Update booking status to verified
      const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        {
          status: 'VERIFIED',
          verifiedBy: session.user.id,
          verifiedAt: new Date()
        },
        { new: true }
      )

      if (!updatedBooking) {
        logger.error('Failed to update booking during verification', { bookingId })
        return NextResponse.json({ 
          success: false, 
          message: 'Failed to update booking' 
        }, { status: 500 })
      }

      logger.info('Booking verified successfully', { 
        bookingId, 
        verifiedBy: session.user.id 
      })

      return NextResponse.json({
        success: true,
        message: 'Booking verified successfully',
        booking: sanitizeApiResponse({
          id: updatedBooking._id,
          eventName: updatedBooking.eventName,
          eventType: updatedBooking.eventType,
          startTime: updatedBooking.startTime,
          endTime: updatedBooking.endTime,
          participantCount: updatedBooking.participantCount,
          status: updatedBooking.status,
          verifiedAt: updatedBooking.verifiedAt,
          verifiedBy: updatedBooking.verifiedBy
        })
      })
    }

    return NextResponse.json({ 
      success: false, 
      message: 'Invalid action' 
    }, { status: 400 })

  } catch (error) {
    logger.error('Verify booking error', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      logger.warn('Unauthorized GET verification attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting for GET requests too
    const userIdentifier = session.user.id || session.user.email || 'anonymous'
    if (!checkRateLimit(`verify_get_${userIdentifier}`, 30, 60000)) {
      logger.warn('Rate limit exceeded for GET verification', { user: userIdentifier })
      return NextResponse.json({ 
        error: 'Too many requests. Please try again later.' 
      }, { status: 429 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      logger.warn('Missing verification code in GET request')
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 }
      )
    }

    // This GET method is deprecated - should use POST for all verification
    logger.warn('Deprecated GET verification endpoint used', { user: userIdentifier })
    return NextResponse.json(
      { error: 'This endpoint is deprecated. Please use POST method.' },
      { status: 410 }
    )

  } catch (error) {
    logger.error('Get verification info error', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
