import mongoose from 'mongoose'

const friendRequestSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
)

// Index to prevent duplicate pending requests
friendRequestSchema.index({ senderId: 1, receiverId: 1, status: 1 })

export default mongoose.model('FriendRequest', friendRequestSchema)
