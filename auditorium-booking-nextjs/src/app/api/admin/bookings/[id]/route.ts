import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import connectDB from '@/lib/db'
import Booking from '@/models/Booking'
import EmailService from '@/lib/emailService'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { action, rejectionReason, cancellationReason } = body

    await connectDB()

    const booking = await Booking.findById(id)
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    switch (action) {
      case 'approve':
        // Check for conflicts before approving
        const conflicts = await Booking.checkConflicts(
          booking.startTime,
          booking.endTime,
          booking.extraTimePre,
          booking.extraTimePost,
          booking._id.toString()
        )
        
        const approvedConflicts = conflicts.filter(c => c.status === 'APPROVED' || c.status === 'PARTIALLY_APPROVED')
        const blockedConflicts = conflicts.filter(c => (c as any).isBlockedSlot)
        
        // Check for blocked time conflicts first
        if (blockedConflicts.length > 0) {
          return NextResponse.json({ 
            error: 'Cannot approve booking - time slot is blocked by administrator',
            blockedReason: blockedConflicts[0].eventName
          }, { status: 409 })
        }
        
        if (approvedConflicts.length > 0) {
          return NextResponse.json({ 
            error: 'Conflict detected! There is already an approved/partially approved booking for this time slot.',
            conflicts: approvedConflicts.map(c => ({
              _id: c._id,
              eventName: c.eventName,
              startTime: c.startTime,
              endTime: c.endTime,
              userName: c.userName,
              status: c.status
            }))
          }, { status: 409 })
        }

        booking.status = 'APPROVED'
        booking.approvedBy = session.user.id
        booking.approvedAt = new Date()
        
        // Auto-reject other pending bookings that conflict
        const pendingConflicts = conflicts.filter(c => c.status === 'PENDING')
        if (pendingConflicts.length > 0) {
          await Booking.updateMany(
            { 
              _id: { $in: pendingConflicts.map(c => c._id) }
            },
            { 
              status: 'REJECTED',
              rejectionReason: `Automatically rejected due to conflict with approved booking: ${booking.eventName}`
            }
          )
        }
        break

      case 'partial-approve':
        // For partial approval, we only need to check for fully approved conflicts
        const partialConflicts = await Booking.checkConflicts(
          booking.startTime,
          booking.endTime,
          booking.extraTimePre,
          booking.extraTimePost,
          booking._id.toString()
        )
        
        const fullyApprovedConflicts = partialConflicts.filter(c => c.status === 'APPROVED')
        const partialBlockedConflicts = partialConflicts.filter(c => (c as any).isBlockedSlot)
        
        // Check for blocked time conflicts first
        if (partialBlockedConflicts.length > 0) {
          return NextResponse.json({ 
            error: 'Cannot partially approve booking - time slot is blocked by administrator',
            blockedReason: partialBlockedConflicts[0].eventName
          }, { status: 409 })
        }
        
        if (fullyApprovedConflicts.length > 0) {
          return NextResponse.json({ 
            error: 'Conflict detected! There is already a fully approved booking for this time slot.',
            conflicts: fullyApprovedConflicts.map(c => ({
              _id: c._id,
              eventName: c.eventName,
              startTime: c.startTime,
              endTime: c.endTime,
              userName: c.userName
            }))
          }, { status: 409 })
        }

        booking.status = 'PARTIALLY_APPROVED'
        booking.approvedBy = session.user.id
        booking.approvedAt = new Date()
        break

      case 'reject':
        booking.status = 'REJECTED'
        if (rejectionReason) {
          booking.rejectionReason = rejectionReason
        }
        break

      case 'cancel':
        // Only allow cancellation of approved bookings
        if (booking.status !== 'APPROVED') {
          return NextResponse.json({ 
            error: 'Only approved bookings can be canceled' 
          }, { status: 400 })
        }
        
        if (!cancellationReason) {
          return NextResponse.json({ 
            error: 'Cancellation reason is required' 
          }, { status: 400 })
        }

        booking.status = 'CANCELLED'
        booking.rejectionReason = cancellationReason // Use rejectionReason field for cancellation reason
        // booking.canceledBy = session.user.id  // Will add these fields to model later
        // booking.canceledAt = new Date()       // Will add these fields to model later
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    await booking.save()

    // Send email notification based on action
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
          .map(([key, _]) => key),
        rejectionReason,
        cancellationReason
      }
      
      switch (action) {
        case 'approve':
          if (booking.isExternal) {
            await emailService.sendExternalApproved(emailData)
          } else {
            await emailService.sendInternalApproved(emailData)
          }
          break
        case 'partial-approve':
          await emailService.sendExternalPartiallyApproved(emailData)
          break
        case 'reject':
        case 'cancel':
          await emailService.sendAdminCancelled(emailData)
          break
      }
    } catch (emailError) {
      console.error('Email notification error:', emailError)
      // Don't fail the booking update if email fails
    }

    return NextResponse.json({ 
      success: true, 
      booking: booking.toObject() 
    })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { id } = await params

    await connectDB()

    const booking = await Booking.findById(id).lean()
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    return NextResponse.json({ booking })
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}