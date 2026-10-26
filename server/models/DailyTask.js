import mongoose from 'mongoose'

const dailyTaskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
      index: true,
    },
    completed: {
      type: Boolean,
      default: false,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
      index: true,
    },
    category: {
      type: String,
      trim: true,
      maxlength: 50,
      default: 'General',
    },
  },
  {
    timestamps: true,
  }
)

// Compound index for optimal querying by user, scheduled date, and completion status
dailyTaskSchema.index({ userId: 1, date: 1, priority: 1, createdAt: 1 })
dailyTaskSchema.index({ userId: 1, date: 1, completed: 1 })

export default mongoose.model('DailyTask', dailyTaskSchema)
