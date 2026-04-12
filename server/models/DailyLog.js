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

export default mongoose.model('DailyLog', dailyLogSchema)
