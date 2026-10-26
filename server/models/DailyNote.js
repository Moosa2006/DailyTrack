import mongoose from 'mongoose'

const dailyNoteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    content: {
      type: String,
      default: '',
      maxlength: 10000,
    },
  },
  {
    timestamps: true,
  }
)

// Ensure strictly one daily note per user per calendar date
dailyNoteSchema.index({ userId: 1, date: 1 }, { unique: true })

export default mongoose.model('DailyNote', dailyNoteSchema)
