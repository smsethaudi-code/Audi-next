import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import connectDB from '@/lib/db'
import Booking from '@/models/Booking'
import { canViewAllBookings } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canViewAllBookings(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'stats') {
      // Get dashboard statistics
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const [
        totalBookings,
        pendingBookings,
        approvedBookings,
        rejectedBookings,
        monthlyBookings,
        todayBookings,
        upcomingBookings
      ] = await Promise.all([
        Booking.countDocuments(),
        Booking.countDocuments({ status: 'PENDING' }),
        Booking.countDocuments({ status: 'APPROVED' }),
        Booking.countDocuments({ status: 'REJECTED' }),
        Booking.countDocuments({
          createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        }),
        Booking.countDocuments({
          startTime: {
            $gte: new Date(now.setHours(0, 0, 0, 0)),
            $lt: new Date(now.setHours(23, 59, 59, 999))
          }
        }),
        Booking.countDocuments({
          startTime: { $gte: now },
          status: 'APPROVED'
        })
      ])

      // Get recent bookings
      const recentBookings = await Booking.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()

      // Get booking trends (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - i)
        return date
      }).reverse()

      const bookingTrends = await Promise.all(
        last7Days.map(async (date) => {
          const startOfDay = new Date(date)
          startOfDay.setHours(0, 0, 0, 0)
          const endOfDay = new Date(date)
          endOfDay.setHours(23, 59, 59, 999)

          const count = await Booking.countDocuments({
            createdAt: { $gte: startOfDay, $lte: endOfDay }
          })

          return {
            date: date.toISOString().split('T')[0],
            count
          }
        })
      )

      return NextResponse.json({
        stats: {
          total: totalBookings,
          pending: pendingBookings,
          approved: approvedBookings,
          rejected: rejectedBookings,
          monthly: monthlyBookings,
          today: todayBookings,
          upcoming: upcomingBookings
        },
        recentBookings,
        trends: bookingTrends
      })
    }

    if (action === 'all') {
      // Lifetime list for the admin dashboard - filtering, pagination and CSV export happen client-side
      const allBookings = await Booking.find()
        .sort({ startTime: -1 })
        .lean()

      return NextResponse.json({ bookings: allBookings })
    }

    if (action === 'pending') {
      // Get pending bookings for approval
      const pendingBookings = await Booking.find({ status: 'PENDING' })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()

      return NextResponse.json({ bookings: pendingBookings })
    }

    // Default: return all bookings with pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    const status = searchParams.get('status')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {}
    if (status && status !== 'ALL') {
      query.status = status
    }

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Booking.countDocuments(query)
    ])

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Admin bookings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
