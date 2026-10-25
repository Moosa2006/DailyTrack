import User from '../models/User.js'
import FriendRequest from '../models/FriendRequest.js'

export const sendFriendRequest = async (req, res) => {
  try {
    const { username } = req.body
    const senderId = req.user.id

    if (!username) {
      return res.status(400).json({ message: 'Username is required' })
    }

    const receiver = await User.findOne({ username: String(username).toLowerCase() })
    if (!receiver) {
      return res.status(404).json({ message: 'User not found' })
    }

    const receiverId = receiver._id

    if (senderId.toString() === receiverId.toString()) {
      return res.status(400).json({ message: 'You cannot add yourself' })
    }

    const sender = await User.findById(senderId)
    if (sender.friends.includes(receiverId)) {
      return res.status(400).json({ message: 'You are already friends with this user' })
    }

    const reversePending = await FriendRequest.findOne({
      senderId: receiverId,
      receiverId: senderId,
      status: 'pending',
    })
    if (reversePending) {
      return res.status(400).json({
        message: 'This user already sent you a request. Accept it from Requests.',
      })
    }

    const existingRequest = await FriendRequest.findOne({
      senderId,
      receiverId,
      status: { $in: ['pending', 'accepted'] },
    })

    if (existingRequest) {
      return res.status(400).json({
        message:
          existingRequest.status === 'accepted'
            ? 'You are already friends with this user'
            : 'A request is already pending',
      })
    }

    const friendRequest = new FriendRequest({ senderId, receiverId })
    await friendRequest.save()

    res.status(201).json({
      message: 'Friend request sent',
      friendRequest,
    })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
}

export const respondToFriendRequest = async (req, res) => {
  try {
    const { id } = req.params
    const { action } = req.body
    const userId = req.user.id

    if (!['accepted', 'rejected'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' })
    }

    const friendRequest = await FriendRequest.findById(id)
    if (!friendRequest) {
      return res.status(404).json({ message: 'Request not found' })
    }

    if (friendRequest.receiverId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been answered' })
    }

    friendRequest.status = action
    await friendRequest.save()

    if (action === 'accepted') {
      await User.findByIdAndUpdate(friendRequest.senderId, {
        $addToSet: { friends: friendRequest.receiverId },
      })
      await User.findByIdAndUpdate(friendRequest.receiverId, {
        $addToSet: { friends: friendRequest.senderId },
      })
    }

    res.json({
      message: `Request ${action}`,
      friendRequest,
    })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
}

export const getFriendsList = async (req, res) => {
  try {
    const userId = req.user.id

    const user = await User.findById(userId).populate('friends', 'name username')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({
      friends: user.friends,
    })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
}

export const getPendingRequests = async (req, res) => {
  try {
    const userId = req.user.id

    const requests = await FriendRequest.find({
      receiverId: userId,
      status: 'pending',
    })
      .populate('senderId', 'name username')
      .sort({ createdAt: -1 })

    res.json({
      requests,
    })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
}

export const getSentRequests = async (req, res) => {
  try {
    const userId = req.user.id

    const requests = await FriendRequest.find({
      senderId: userId,
    })
      .populate('receiverId', 'name username')
      .sort({ createdAt: -1 })

    res.json({
      requests,
    })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
}

export const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params
    const userId = req.user.id

    if (friendId === userId) {
      return res.status(400).json({ message: 'Invalid friend' })
    }

    const user = await User.findById(userId)
    if (!user?.friends.some((id) => id.toString() === friendId)) {
      return res.status(404).json({ message: 'Friend not found' })
    }

    await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } })
    await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } })

    res.json({ message: 'Friend removed' })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
}

export const cancelFriendRequest = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const request = await FriendRequest.findById(id)
    if (!request) {
      return res.status(404).json({ message: 'Request not found' })
    }

    if (request.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    await FriendRequest.deleteOne({ _id: id })
    res.json({ message: 'Request cancelled' })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
}
