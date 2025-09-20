import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import connectDB from '@/lib/db'
import Booking from '@/models/Booking'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    const { bookingId, verificationCode, action = 'validate' } = body

    if (!bookingId || !verificationCode) {
      return NextResponse.json({ 
        success: false, 
        message: 'Booking ID and verification code are required' 
      }, { status: 400 })
    }

    // Find the booking by ID
    const booking = await Booking.findById(bookingId)

    if (!booking) {
      return NextResponse.json({ 
        success: false, 
        message: 'Booking not found' 
      }, { status: 404 })
    }

    // Check if booking is approved
    if (booking.status !== 'APPROVED') {
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
      return NextResponse.json({ 
        success: false, 
        message: `Verification can only be done within 1 day of the event date (${eventDate.toLocaleDateString()})` 
      }, { status: 400 })
    }

    // If action is just validation, return booking info without updating
    if (action === 'validate') {
      return NextResponse.json({
        success: true,
        message: 'QR code is valid',
        booking: {
          id: booking._id,
          eventName: booking.eventName,
          eventType: booking.eventType,
          userName: booking.userName,
          userEmail: booking.userEmail,
          startTime: booking.startTime,
          endTime: booking.endTime,
          participantCount: booking.participantCount,
          status: booking.status
        }
      })
    }

    // If action is verify and user is admin, update status to verified
    if (action === 'verify') {
      if (session.user?.role !== 'admin') {
        return NextResponse.json({ 
          success: false, 
          message: 'Admin access required to verify bookings' 
        }, { status: 403 })
      }

      // Check if already verified
      if (booking.verifiedAt) {
        return NextResponse.json({ 
          success: false, 
          message: 'Booking has already been verified',
          booking: {
            id: booking._id,
            eventName: booking.eventName,
            verifiedAt: booking.verifiedAt,
            verifiedBy: booking.verifiedBy
          }
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
        return NextResponse.json({ 
          success: false, 
          message: 'Failed to update booking' 
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Booking verified successfully',
        booking: {
          id: updatedBooking._id,
          eventName: updatedBooking.eventName,
          eventType: updatedBooking.eventType,
          startTime: updatedBooking.startTime,
          endTime: updatedBooking.endTime,
          participantCount: updatedBooking.participantCount,
          status: updatedBooking.status,
          verifiedAt: updatedBooking.verifiedAt,
          verifiedBy: updatedBooking.verifiedBy
        }
      })
    }

    return NextResponse.json({ 
      success: false, 
      message: 'Invalid action' 
    }, { status: 400 })

  } catch (error) {
    console.error('Verify booking error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 }
      )
    }

    // Find booking by verification code
    const booking = await Booking.findOne({
      verificationCode: code,
      status: 'APPROVED'
    }).lean()

    if (!booking) {
      return NextResponse.json(
        { error: 'Invalid verification code or booking not approved' },
        { status: 404 }
      )
    }

    // Return basic booking info for verification
    return NextResponse.json({
      valid: true,
      booking: {
        eventName: booking.eventName,
        userName: booking.userName,
        startTime: booking.startTime,
        endTime: booking.endTime,
        verificationCode: booking.verificationCode
      }
    })

  } catch (error) {
    console.error('Get verification info error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
