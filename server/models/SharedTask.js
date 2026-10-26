import mongoose from 'mongoose'

const sharedTaskSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
  },
  { timestamps: true }
)

sharedTaskSchema.index({ receiverId: 1, status: 1 })
sharedTaskSchema.index({ senderId: 1, status: 1 })
sharedTaskSchema.index({ taskId: 1, receiverId: 1, status: 1 })

export default mongoose.model('SharedTask', sharedTaskSchema)

