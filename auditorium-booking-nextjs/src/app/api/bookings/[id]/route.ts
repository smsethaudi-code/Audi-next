import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import connectDB from '@/lib/db'
import Booking, { IBooking } from '@/models/Booking'
import { canApproveBooking } from '@/lib/auth'
import { generateVerificationCode } from '@/lib/utils'
import EmailService from '@/lib/emailService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const booking = await Booking.findById(id).lean() as IBooking | null
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Users can only view their own bookings unless they're admin
    if (booking.userEmail !== session.user.email && !canApproveBooking(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ booking })
  } catch (error) {
    console.error('Get booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const booking = await Booking.findById(id)
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const body = await request.json()
    const { 
      status, 
      rejectionReason,
      // User edit fields
      eventName,
      eventType,
      eventDescription,
      participantCount,
      startTime,
      endTime,
      instituteName,
      coordinatorPhone,
      specialRequirements,
      extraTimePre,
      extraTimePost,
      isExternal,
      externalServices
    } = body

    // Check if this is a user edit (has booking content fields) vs admin status change
    const isUserEdit = eventName || eventType || eventDescription || participantCount || startTime || endTime
    
    if (isUserEdit) {
      // Users can only edit their own bookings
      if (booking.userEmail !== session.user.email) {
        return NextResponse.json({ error: 'Forbidden - You can only edit your own bookings' }, { status: 403 })
      }
      
      // Users can edit pending and approved bookings, but not rejected/cancelled ones
      if (!['PENDING', 'APPROVED', 'PARTIALLY_APPROVED'].includes(booking.status)) {
        return NextResponse.json({ error: 'Cannot edit cancelled or rejected bookings' }, { status: 400 })
      }

      // If editing an approved booking, check for conflicts with the new time slot
      if ((startTime || endTime) && ['APPROVED', 'PARTIALLY_APPROVED'].includes(booking.status)) {
        const newStartTime = startTime ? new Date(startTime) : booking.startTime
        const newEndTime = endTime ? new Date(endTime) : booking.endTime
        const extraTimeBefore = extraTimePre !== undefined ? parseInt(extraTimePre) || 0 : booking.extraTimePre
        const extraTimeAfter = extraTimePost !== undefined ? parseInt(extraTimePost) || 0 : booking.extraTimePost

        // Check for conflicts excluding this booking
        const conflicts = await Booking.checkConflicts(newStartTime, newEndTime, extraTimeBefore, extraTimeAfter, booking._id)
        
        if (conflicts.length > 0) {
          // Check if any conflict is a blocked time slot
          const blockedConflicts = conflicts.filter(c => (c as any).isBlockedSlot)
          const bookingConflicts = conflicts.filter(c => !(c as any).isBlockedSlot)
          
          if (blockedConflicts.length > 0) {
            return NextResponse.json({
              error: 'Cannot edit booking - new time slot is blocked by administrator',
              reason: blockedConflicts[0].eventName,
              type: 'blocked'
            }, { status: 409 })
          }
          
          if (bookingConflicts.length > 0) {
            return NextResponse.json({
              error: 'Cannot edit booking - new time slot conflicts with existing booking',
              conflicts: bookingConflicts.map(c => ({
                id: c._id,
                eventName: c.eventName,
                startTime: c.startTime,
                endTime: c.endTime,
                status: c.status
              })),
              type: 'booking'
            }, { status: 409 })
          }
        }
      }

      // If editing an approved booking, it becomes pending again for re-approval
      if (['APPROVED', 'PARTIALLY_APPROVED'].includes(booking.status)) {
        booking.status = 'PENDING'
        booking.approvedBy = undefined
        booking.approvedAt = undefined
        booking.verificationCode = undefined
      }

      // Update booking fields
      if (eventName) booking.eventName = eventName
      if (eventType) booking.eventType = eventType
      if (eventDescription) booking.eventDescription = eventDescription
      if (participantCount) booking.participantCount = parseInt(participantCount)
      if (startTime) booking.startTime = new Date(startTime)
      if (endTime) booking.endTime = new Date(endTime)
      if (instituteName) booking.instituteName = instituteName
      if (coordinatorPhone) booking.coordinatorPhone = coordinatorPhone
      if (specialRequirements !== undefined) booking.specialRequirements = specialRequirements
      if (extraTimePre !== undefined) booking.extraTimePre = parseInt(extraTimePre) || 0
      if (extraTimePost !== undefined) booking.extraTimePost = parseInt(extraTimePost) || 0
      if (isExternal !== undefined) booking.isExternal = Boolean(isExternal)
      if (externalServices) booking.externalServices = externalServices
    }

    // Only admins can approve/reject bookings
    if (status && ['APPROVED', 'REJECTED', 'PARTIALLY_APPROVED'].includes(status)) {
      if (!canApproveBooking(session.user.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      booking.status = status
      booking.approvedBy = session.user.email || 'Unknown'
      booking.approvedAt = new Date()

      if (status === 'REJECTED' && rejectionReason) {
        booking.rejectionReason = rejectionReason
      }

      // Generate QR code for approved bookings
      if (status === 'APPROVED' && !booking.verificationCode) {
        const verificationCode = generateVerificationCode(booking._id.toString())
        booking.verificationCode = verificationCode
      }
    }

    // Users can cancel their own bookings (pending, approved, or partially approved)
    if (status === 'CANCELLED') {
      if (booking.userEmail !== session.user.email && !canApproveBooking(session.user.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      
      // Users can cancel pending, approved, or partially approved bookings
      if (!['PENDING', 'APPROVED', 'PARTIALLY_APPROVED'].includes(booking.status)) {
        return NextResponse.json({ error: 'Cannot cancel this booking' }, { status: 400 })
      }
      
      booking.status = 'CANCELLED'
      booking.cancelledAt = new Date()
      booking.cancelledBy = session.user.email || 'Unknown'
    }

    const updatedBooking = await booking.save()

    // Send email notification for user cancellation
    if (status === 'CANCELLED') {
      try {
        const emailService = new EmailService()
        const emailData = {
          bookingId: booking._id.toString(),
          eventName: booking.eventName,
          eventType: booking.eventType,
          userName: booking.userName,
          userEmail: booking.userEmail,
          startTime: booking.startTime.toISOString(),
          endTime: booking.endTime.toISOString(),
          participantCount: booking.participantCount,
          eventDescription: booking.eventDescription,
          isExternal: booking.isExternal,
          externalServices: Object.entries(booking.externalServices || {})
            .filter(([_, value]) => value)
            .map(([key, _]) => key)
        }
        
        await emailService.sendUserCancelled(emailData)
      } catch (emailError) {
        console.error('Email notification error:', emailError)
        // Don't fail the booking update if email fails
      }
    }

    return NextResponse.json({
      message: 'Booking updated successfully',
      booking: updatedBooking
    })
  } catch (error) {
    console.error('Update booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const booking = await Booking.findById(id)
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Users can only delete their own pending bookings or admins can delete any
    const canDelete = (booking.userEmail === session.user.email && booking.status === 'PENDING') ||
                     canApproveBooking(session.user.role)

    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await Booking.findByIdAndDelete(id)

    return NextResponse.json({
      message: 'Booking deleted successfully'
    })
  } catch (error) {
    console.error('Delete booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}