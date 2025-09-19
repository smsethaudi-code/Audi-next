import mongoose, { Schema, Document } from 'mongoose'

export interface IBlockedTimeSlot extends Document {
  startTime: Date
  endTime: Date
  reason: string
  blockedBy: string // admin user ID
  blockedByName: string
  isRecurring: boolean
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly'
    interval: number // every X days/weeks/months
    endDate?: Date
  }
  createdAt: Date
  updatedAt: Date
}

interface IBlockedTimeSlotModel extends mongoose.Model<IBlockedTimeSlot> {
  isTimeSlotBlocked(startTime: Date, endTime: Date): Promise<boolean>
}

const BlockedTimeSlotSchema = new Schema<IBlockedTimeSlot>(
  {
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    blockedBy: {
      type: String,
      required: true,
    },
    blockedByName: {
      type: String,
      required: true,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        required: function(this: IBlockedTimeSlot) {
          return this.isRecurring
        }
      },
      interval: {
        type: Number,
        min: 1,
        required: function(this: IBlockedTimeSlot) {
          return this.isRecurring
        }
      },
      endDate: {
        type: Date,
        required: function(this: IBlockedTimeSlot) {
          return this.isRecurring
        }
      }
    }
  },
  {
    timestamps: true,
  }
)

// Indexes
BlockedTimeSlotSchema.index({ startTime: 1, endTime: 1 })
BlockedTimeSlotSchema.index({ blockedBy: 1 })

// Validation: End time must be after start time
BlockedTimeSlotSchema.pre('save', function (next) {
  if (this.endTime <= this.startTime) {
    next(new Error('End time must be after start time'))
  } else {
    next()
  }
})

// Static method to check if a time slot is blocked
BlockedTimeSlotSchema.statics.isTimeSlotBlocked = async function (
  startTime: Date,
  endTime: Date
) {
  const blockedSlots = await this.find({
    $or: [
      {
        $and: [
          { startTime: { $lt: endTime } },
          { endTime: { $gt: startTime } }
        ]
      }
    ]
  })

  return blockedSlots.length > 0
}

const BlockedTimeSlot = (mongoose.models.BlockedTimeSlot || 
  mongoose.model<IBlockedTimeSlot>('BlockedTimeSlot', BlockedTimeSlotSchema)) as IBlockedTimeSlotModel

export default BlockedTimeSlot