import mongoose from 'mongoose'

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: 'General',
    },
  },
  { timestamps: true }
)

taskSchema.index({ userId: 1, createdAt: 1 })

export default mongoose.model('Task', taskSchema)
