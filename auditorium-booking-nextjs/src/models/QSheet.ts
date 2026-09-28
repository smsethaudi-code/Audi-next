import mongoose, { Schema, Document } from 'mongoose'
import { MAX_QSHEET_BYTES } from '@/lib/qsheet'

// Uploaded Q (cue) sheet file for an approved booking - one per booking.
// Kept out of the Booking collection so booking lists never load file bytes.
export interface IQSheet extends Document {
  bookingId: string
  fileName: string
  contentType: string
  size: number
  data: Buffer
  uploadedBy: string
  createdAt: Date
  updatedAt: Date
}

const QSheetSchema = new Schema<IQSheet>(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
    },
    fileName: {
      type: String,
      required: true,
      maxlength: 200,
    },
    contentType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
      max: MAX_QSHEET_BYTES,
    },
    data: {
      type: Buffer,
      required: true,
    },
    uploadedBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

const QSheet = mongoose.models.QSheet || mongoose.model<IQSheet>('QSheet', QSheetSchema)
export default QSheet
