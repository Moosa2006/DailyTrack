import mongoose from 'mongoose'

const dailyLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    tasks: [
      {
        taskId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Task',
        },
        title: {
          type: String,
          default: '',
        },
        completed: {
          type: Boolean,
          default: false,
        },
      },
    ],
    notes: {
      type: String,
      default: '',
    },
    completionPercentage: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
)

dailyLogSchema.index({ userId: 1, date: 1 }, { unique: true })
dailyLogSchema.index({ userId: 1, completionPercentage: 1, date: 1 })

export default mongoose.model('DailyLog', dailyLogSchema)
