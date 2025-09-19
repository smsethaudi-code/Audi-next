import mongoose, { Schema, Document } from 'mongoose'
import BlockedTimeSlot from './BlockedTimeSlot'

export interface IBooking extends Document {
  _id: string
  eventName: string
  eventType: string
  eventDescription: string
  startTime: Date
  endTime: Date
  userName: string
  userEmail: string
  userId: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'PARTIALLY_APPROVED' | 'VERIFIED'
  approvedBy?: string
  approvedAt?: Date
  rejectionReason?: string
  verificationCode?: string
  verifiedBy?: string
  verifiedAt?: Date
  participantCount: number
  specialRequirements?: string
  instituteName: string
  coordinatorPhone: string
  extraTimePre: number
  extraTimePost: number
  isExternal: boolean
  externalServices: {
    refreshments: boolean
    transport: boolean
    hostel: boolean
    mediaPhotoCoverage: boolean
  }
  totalCost: number
  cancelledBy?: string
  cancelledAt?: Date
  createdAt: Date
  updatedAt: Date
}

interface IBookingModel extends mongoose.Model<IBooking> {
  checkConflicts(
    startTime: Date,
    endTime: Date,
    extraTimePre?: number,
    extraTimePost?: number,
    excludeBookingId?: string
  ): Promise<IBooking[]>
}

const BookingSchema = new Schema<IBooking>(
  {
    eventName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    eventType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    eventDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    participantCount: {
      type: Number,
      required: true,
      min: 1,
      max: 1000,
    },
    instituteName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    coordinatorPhone: {
      type: String,
      required: true,
      trim: true,
      match: /^\d{10}$/,
    },
    specialRequirements: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    extraTimePre: {
      type: Number,
      default: 0,
      min: 0,
      max: 120, // 2 hours max
    },
    extraTimePost: {
      type: Number,
      default: 0,
      min: 0,
      max: 120, // 2 hours max
    },
    isExternal: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PARTIALLY_APPROVED', 'APPROVED', 'REJECTED', 'CANCELLED', 'VERIFIED'],
      default: 'PENDING',
    },
    externalServices: {
      refreshments: {
        type: Boolean,
        default: false,
      },
      transport: {
        type: Boolean,
        default: false,
      },
      hostel: {
        type: Boolean,
        default: false,
      },
      mediaPhotoCoverage: {
        type: Boolean,
        default: false,
      },
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    verificationCode: {
      type: String,
      default: null,
    },
    verifiedBy: {
      type: String,
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
      maxlength: 500,
    },
    cancelledBy: {
      type: String,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for better query performance
BookingSchema.index({ userId: 1, createdAt: -1 })
BookingSchema.index({ status: 1, startTime: 1 })
BookingSchema.index({ startTime: 1, endTime: 1 })
BookingSchema.index({ verificationCode: 1 })

// Validation: End time must be after start time
BookingSchema.pre('save', function (next) {
  if (this.endTime <= this.startTime) {
    next(new Error('End time must be after start time'))
  } else {
    next()
  }
})

// Virtual for total booking duration including extra time
BookingSchema.virtual('totalDuration').get(function () {
  const start = new Date(this.startTime)
  const end = new Date(this.endTime)
  start.setMinutes(start.getMinutes() - this.extraTimePre)
  end.setMinutes(end.getMinutes() + this.extraTimePost)
  return end.getTime() - start.getTime()
})

// Virtual for actual start time (including extra time before)
BookingSchema.virtual('actualStartTime').get(function () {
  const start = new Date(this.startTime)
  start.setMinutes(start.getMinutes() - this.extraTimePre)
  return start
})

// Virtual for actual end time (including extra time after)
BookingSchema.virtual('actualEndTime').get(function () {
  const end = new Date(this.endTime)
  end.setMinutes(end.getMinutes() + this.extraTimePost)
  return end
})

// Static method to check for conflicts
BookingSchema.statics.checkConflicts = async function (
  startTime: Date,
  endTime: Date,
  extraTimePre: number = 0,
  extraTimePost: number = 0,
  excludeBookingId?: string
) {
  const actualStart = new Date(startTime)
  actualStart.setMinutes(actualStart.getMinutes() - extraTimePre)
  
  const actualEnd = new Date(endTime)
  actualEnd.setMinutes(actualEnd.getMinutes() + extraTimePost)

  // Check for booking conflicts
  const bookingQuery: {
    status: { $in: string[] };
    _id?: { $ne: string };
    $or: Array<{
      $and: Array<{
        startTime?: { $lt: Date; $gt?: Date };
        endTime?: { $gt: Date; $lt?: Date };
      }>;
    }>;
  } = {
    status: { $in: ['PENDING', 'PARTIALLY_APPROVED', 'APPROVED'] },
    $or: [
      {
        $and: [
          { startTime: { $lt: actualEnd } },
          { endTime: { $gt: actualStart } }
        ]
      }
    ]
  }

  if (excludeBookingId) {
    bookingQuery._id = { $ne: excludeBookingId }
  }

  const bookingConflicts = await this.find(bookingQuery)

  // Check for blocked time slot conflicts
  let blockedSlotConflicts: any[] = []
  
  try {
    blockedSlotConflicts = await BlockedTimeSlot.find({
      $or: [
        {
          $and: [
            { startTime: { $lt: actualEnd } },
            { endTime: { $gt: actualStart } }
          ]
        }
      ]
    })
  } catch (error) {
    console.error('Error checking blocked time slots:', error)
    // Continue without blocked slot conflicts if there's an error
  }

  // Combine and return all conflicts
  return [...bookingConflicts, ...blockedSlotConflicts.map(slot => ({
    ...slot.toObject(),
    _id: `blocked_${slot._id}`,
    eventName: `BLOCKED: ${slot.reason}`,
    status: 'BLOCKED',
    isBlockedSlot: true
  }))]
}

// Export model
const Booking = (mongoose.models.Booking || mongoose.model<IBooking, IBookingModel>('Booking', BookingSchema)) as unknown as IBookingModel
export default Booking