import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import connectDB from '@/lib/db'
import Booking, { IBooking } from '@/models/Booking'
import QSheet from '@/models/QSheet'
import { canApproveBooking } from '@/lib/auth'
import EmailService from '@/lib/emailService'
import { QSHEET_TYPES, QSHEET_UPLOAD_STATUSES, getQSheetExtension, validateQSheetFile } from '@/lib/qsheet'

// Strip any path and characters that are unsafe in file names or download headers
function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() || ''
  return base.replace(/[\u0000-\u001f"<>|:*?]/g, '').trim().slice(-150) || 'q-sheet'
}

// Upload or replace the Q sheet of an approved booking (multipart form field "file")
export async function POST(
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

    if (booking.userEmail !== session.user.email && !canApproveBooking(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!QSHEET_UPLOAD_STATUSES.includes(booking.status)) {
      return NextResponse.json(
        { error: 'A Q sheet can only be uploaded once the booking is approved' },
        { status: 400 }
      )
    }

    let file: FormDataEntryValue | null = null
    try {
      file = (await request.formData()).get('file')
    } catch {
      return NextResponse.json({ error: 'Invalid upload' }, { status: 400 })
    }

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const fileName = sanitizeFileName(file.name)
    const validationError = validateQSheetFile(fileName, file.size)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const bookingId = booking._id.toString()
    const contentType = QSHEET_TYPES[getQSheetExtension(fileName)]
    const data = Buffer.from(await file.arrayBuffer())
    const qSheet = { fileName, contentType, size: data.length, uploadedAt: new Date() }

    await QSheet.findOneAndUpdate(
      { bookingId },
      { bookingId, fileName, contentType, size: data.length, data, uploadedBy: session.user.email },
      { upsert: true, runValidators: true }
    )
    // updateOne (not save) so older bookings missing newer required fields still update
    await Booking.updateOne({ _id: booking._id }, { $set: { qSheet } })

    // Send the Q sheet to the admin
    try {
      const emailService = new EmailService()
      await emailService.sendQSheetUploaded(
        {
          bookingId,
          eventName: booking.eventName,
          eventType: booking.eventType,
          guestName: booking.guestName,
          userName: booking.userName,
          userEmail: booking.userEmail,
          startTime: booking.startTime.toISOString(),
          endTime: booking.endTime.toISOString(),
          participantCount: booking.participantCount,
          isExternal: booking.isExternal
        },
        { fileName, content: data, contentType }
      )
    } catch (emailError) {
      console.error('Email notification error:', emailError)
      // Don't fail the upload if email fails
    }

    return NextResponse.json({ message: 'Q sheet uploaded successfully', qSheet })
  } catch (error) {
    console.error('Upload Q sheet error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Download the Q sheet - booking owner or admin only
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

    const booking = await Booking.findById(id).select('userEmail').lean() as IBooking | null
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.userEmail !== session.user.email && !canApproveBooking(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const qSheet = await QSheet.findOne({ bookingId: id })
    if (!qSheet) {
      return NextResponse.json({ error: 'No Q sheet uploaded for this booking' }, { status: 404 })
    }

    const asciiName = qSheet.fileName.replace(/[^\x20-\x7e]/g, '_')
    return new NextResponse(new Uint8Array(qSheet.data), {
      headers: {
        'Content-Type': qSheet.contentType,
        'Content-Length': String(qSheet.data.length),
        // Always download, never render inline on our domain
        'Content-Disposition': `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(qSheet.fileName)}`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-store'
      }
    })
  } catch (error) {
    console.error('Download Q sheet error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
