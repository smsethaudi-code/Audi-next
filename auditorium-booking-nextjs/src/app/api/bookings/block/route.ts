import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import connectDB from '@/lib/db'
import BlockedTimeSlot from '@/models/BlockedTimeSlot'
import { canBlockTimeSlots } from '@/lib/auth'
import { isValidTimeSlot } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canBlockTimeSlots(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {}

    if (startDate && endDate) {
      query.startTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }

    const blockedSlots = await BlockedTimeSlot.find(query)
      .sort({ startTime: 1 })
      .lean()

    return NextResponse.json({ blockedSlots })
  } catch (error) {
    console.error('Get blocked slots error:', error)
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

    if (!canBlockTimeSlots(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectDB()

    const body = await request.json()
    const {
      startTime,
      endTime,
      reason,
      isRecurring = false,
      recurringPattern
    } = body

    // Validate required fields
    if (!startTime || !endTime || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const start = new Date(startTime)
    const end = new Date(endTime)

    // Validate time slot
    if (!isValidTimeSlot(start, end)) {
      return NextResponse.json(
        { error: 'Invalid time slot' },
        { status: 400 }
      )
    }

    // Create blocked time slot
    const newBlockedSlot = new BlockedTimeSlot({
      startTime: start,
      endTime: end,
      reason,
      blockedBy: session.user.id,
      blockedByName: session.user.name,
      isRecurring,
      recurringPattern: isRecurring ? recurringPattern : undefined
    })

    const savedBlockedSlot = await newBlockedSlot.save()

    return NextResponse.json({
      message: 'Time slot blocked successfully',
      blockedSlot: savedBlockedSlot
    }, { status: 201 })

  } catch (error) {
    console.error('Block time slot error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canBlockTimeSlots(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Blocked slot ID is required' },
        { status: 400 }
      )
    }

    const blockedSlot = await BlockedTimeSlot.findById(id)
    if (!blockedSlot) {
      return NextResponse.json(
        { error: 'Blocked slot not found' },
        { status: 404 }
      )
    }

    await BlockedTimeSlot.findByIdAndDelete(id)

    return NextResponse.json({
      message: 'Blocked time slot removed successfully'
    })
  } catch (error) {
    console.error('Remove blocked slot error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
