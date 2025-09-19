import mongoose, { Schema, Document } from 'mongoose'
import { User as UserType } from '@/types/user'

export interface IUser extends Omit<UserType, '_id'>, Document {}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ['student', 'faculty', 'admin', 'superadmin'],
      default: 'student',
    },
    department: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

// Index for faster queries
UserSchema.index({ role: 1 })

// Middleware to set role based on email
UserSchema.pre('save', function (next) {
  if (this.isNew || this.isModified('email')) {
    const email = this.get('email') as string
    if (email === process.env.ADMIN_EMAIL) {
      this.set('role', 'admin')
    } else if (email.includes('faculty') || email.includes('prof')) {
      this.set('role', 'faculty')
    } else {
      this.set('role', 'student')
    }
  }
  next()
})

// Export model
const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
export default User