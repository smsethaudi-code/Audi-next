import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import connectDB from '@/lib/db'
import Booking from '@/models/Booking'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    const { verificationCode } = body

    if (!verificationCode) {
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 }
      )
    }

    // Find booking by verification code
    const booking = await Booking.findOne({
      verificationCode: verificationCode,
      status: 'APPROVED'
    }).lean()

    if (!booking) {
      return NextResponse.json(
        { error: 'Invalid verification code or booking not approved' },
        { status: 404 }
      )
    }

    // Check if booking is for today
    const now = new Date()
    const bookingDate = new Date(booking.startTime)
    const isToday = now.toDateString() === bookingDate.toDateString()

    // Check if current time is within booking window (including extra time)
    const actualStartTime = new Date(booking.startTime)
    actualStartTime.setMinutes(actualStartTime.getMinutes() - booking.extraTimePre)
    
    const actualEndTime = new Date(booking.endTime)
    actualEndTime.setMinutes(actualEndTime.getMinutes() + booking.extraTimePost)

    const isWithinTimeWindow = now >= actualStartTime && now <= actualEndTime

    return NextResponse.json({
      valid: true,
      booking: {
        id: booking._id,
        eventName: booking.eventName,
        eventType: booking.eventType,
        userName: booking.userName,
        userEmail: booking.userEmail,
        startTime: booking.startTime,
        endTime: booking.endTime,
        participantCount: booking.participantCount,
        eventDescription: booking.eventDescription,
        externalServices: booking.externalServices,
        verificationCode: booking.verificationCode
      },
      verification: {
        isToday,
        isWithinTimeWindow,
        actualStartTime,
        actualEndTime,
        currentTime: now
      }
    })

  } catch (error) {
    console.error('Verify booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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