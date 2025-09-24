import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import connectDB from '@/lib/db'
import Booking from '@/models/Booking'
import BlockedTimeSlot from '@/models/BlockedTimeSlot'
import { isValidTimeSlot, getISTHours, getISTMinutes } from '@/lib/utils'
import EmailService from '@/lib/emailService'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    // This endpoint is for calendar view - shows approved and pending bookings for availability checking
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {
      status: { $in: ['APPROVED', 'PENDING'] } // Show both for availability visualization
    }

    if (startDate && endDate) {
      query.startTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }

    const bookings = await Booking.find(query)
      .sort({ startTime: 1 })
      .lean()

    // Also fetch blocked time slots for calendar display
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blockedQuery: Record<string, any> = {}
    
    if (startDate && endDate) {
      blockedQuery.startTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }

    const blockedSlots = await BlockedTimeSlot.find(blockedQuery)
      .sort({ startTime: 1 })
      .lean()

    // Transform blocked slots to look like bookings for calendar compatibility
    const transformedBlockedSlots = blockedSlots.map(slot => ({
      ...slot,
      status: 'BLOCKED',
      participantCount: 0,
      instituteName: 'Admin Block',
      userEmail: 'admin',
      userName: 'Administrator',
      isExternal: false,
      isBlockedSlot: true
    }))

    // Combine bookings and blocked slots
    const allItems = [...bookings, ...transformedBlockedSlots]

    return NextResponse.json({ bookings: allItems })
  } catch (error) {
    console.error('Get bookings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    const {
      eventName,
      eventType,
      eventDescription,
      participantCount,
      startTime,
      endTime,
      instituteName,
      coordinatorPhone,
      extraTimePre = 0,
      extraTimePost = 0,
      specialRequirements,
      isExternal = false,
      externalServices
    } = body

    // Validate required fields
    if (!eventName || !eventType || !eventDescription || !participantCount || !startTime || !endTime || !instituteName || !coordinatorPhone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate participant count
    if (participantCount < 1 || participantCount > 1000) {
      return NextResponse.json(
        { error: 'Participant count must be between 1 and 1000' },
        { status: 400 }
      )
    }

    // Validate phone number
    if (!/^\d{10}$/.test(coordinatorPhone)) {
      return NextResponse.json(
        { error: 'Phone number must be 10 digits' },
        { status: 400 }
      )
    }

    const start = new Date(startTime)
    const end = new Date(endTime)

    console.log('Booking request time validation:', {
      startTime,
      endTime,
      parsedStart: start.toISOString(),
      parsedEnd: end.toISOString()
    })

    // Validate time slot with detailed error checking
    if (!isValidTimeSlot(start, end)) {
      const now = new Date()
      const oneMinuteAgo = new Date(now.getTime() - 60000)
      
      if (start <= oneMinuteAgo) {
        return NextResponse.json(
          { error: 'Start time must be in the future' },
          { status: 400 }
        )
      } else if (end <= start) {
        return NextResponse.json(
          { error: 'End time must be after start time' },
          { status: 400 }
        )
      } else {
        // Convert to IST for error messages
        const startHourIST = getISTHours(start)
        const endHourIST = getISTHours(end)
        const endMinuteIST = getISTMinutes(end)
        
        if (startHourIST < 8 || startHourIST >= 22) {
          return NextResponse.json(
            { error: 'Bookings must start between 8:00 AM and 10:00 PM (IST)' },
            { status: 400 }
          )
        } else if (endHourIST > 23 || (endHourIST === 23 && endMinuteIST > 0)) {
          return NextResponse.json(
            { error: 'Bookings must end by 11:00 PM (IST)' },
            { status: 400 }
          )
        } else {
          const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
          if (durationHours > 12) {
            return NextResponse.json(
              { error: 'Maximum booking duration is 12 hours' },
              { status: 400 }
            )
          } else if (durationHours < 0.5) {
            return NextResponse.json(
              { error: 'Minimum booking duration is 30 minutes' },
              { status: 400 }
            )
          } else {
            return NextResponse.json(
              { error: 'Invalid time slot - please check your date and time selection' },
              { status: 400 }
            )
          }
        }
      }
    }

    // Check for conflicts with existing bookings and blocked time slots
    const conflicts = await Booking.checkConflicts(start, end, extraTimePre, extraTimePost)
    if (conflicts.length > 0) {
      // Check if any conflict is a blocked time slot
      const blockedConflicts = conflicts.filter(c => (c as any).isBlockedSlot)
      const bookingConflicts = conflicts.filter(c => !(c as any).isBlockedSlot)
      
      if (blockedConflicts.length > 0) {
        return NextResponse.json(
          { 
            error: 'Time slot is blocked by administrator',
            reason: blockedConflicts[0].eventName,
            type: 'blocked'
          },
          { status: 409 }
        )
      }
      
      if (bookingConflicts.length > 0) {
        return NextResponse.json(
          { 
            error: 'Time slot conflicts with existing booking',
            conflicts: bookingConflicts.map(c => ({
              id: c._id,
              eventName: c.eventName,
              startTime: c.startTime,
              endTime: c.endTime,
              status: c.status
            })),
            type: 'booking'
          },
          { status: 409 }
        )
      }
    }

    // Create booking
    const newBooking = new Booking({
      eventName,
      eventType,
      eventDescription,
      participantCount: parseInt(participantCount),
      instituteName,
      coordinatorPhone,
      specialRequirements,
      startTime: start,
      endTime: end,
      extraTimePre: parseInt(extraTimePre) || 0,
      extraTimePost: parseInt(extraTimePost) || 0,
      isExternal: Boolean(isExternal),
      externalServices: externalServices || {
        refreshments: false,
        transport: false,
        hostel: false,
        mediaPhotoCoverage: false
      },
      userId: session.user.id || session.user.email, // Use email as fallback
      userName: session.user.name!,
      userEmail: session.user.email!,
      status: 'PENDING'
    })

    const savedBooking = await newBooking.save()

    // Send email notification
    try {
      const emailService = new EmailService()
      const emailData = {
        bookingId: savedBooking._id.toString(),
        eventName: savedBooking.eventName,
        eventType: savedBooking.eventType,
        userName: savedBooking.userName,
        userEmail: savedBooking.userEmail,
        startTime: savedBooking.startTime.toISOString(),
        endTime: savedBooking.endTime.toISOString(),
        participantCount: savedBooking.participantCount,
        eventDescription: savedBooking.eventDescription,
        isExternal: savedBooking.isExternal,
        externalServices: Object.entries(savedBooking.externalServices || {})
          .filter(([_, value]) => value)
          .map(([key, _]) => key)
      }
      
      if (Boolean(isExternal)) {
        await emailService.sendExternalBookingReceived(emailData)
      } else {
        await emailService.sendInternalBookingReceived(emailData)
      }
    } catch (emailError) {
      console.error('Email notification error:', emailError)
      // Don't fail the booking creation if email fails
    }

    return NextResponse.json({
      message: 'Booking created successfully',
      booking: savedBooking
    }, { status: 201 })

  } catch (error) {
    console.error('Create booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
