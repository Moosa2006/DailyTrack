import User from '../models/User.js'
import FriendRequest from '../models/FriendRequest.js'

// Send friend request
export const sendFriendRequest = async (req, res) => {
  try {
    const { username } = req.body
    const senderId = req.user.id

    // Validate input
    if (!username) {
      return res.status(400).json({ message: 'Username is required' })
    }

    // Find receiver by username
    const receiver = await User.findOne({ username: username.toLowerCase() })
    if (!receiver) {
      return res.status(404).json({ message: 'User not found' })
    }

    const receiverId = receiver._id

    // Prevent self-request
    if (senderId.toString() === receiverId.toString()) {
      return res.status(400).json({ message: 'Cannot add yourself' })
    }

    // Check if already friends
    const sender = await User.findById(senderId)
    if (sender.friends.includes(receiverId)) {
      return res.status(400).json({ message: 'Already friends with this user' })
    }

    // Check for pending/accepted requests
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { senderId, receiverId, status: { $in: ['pending', 'accepted'] } },
        { senderId: receiverId, receiverId: senderId, status: 'accepted' },
      ],
    })

    if (existingRequest) {
      return res.status(400).json({ message: 'Request already exists or already friends' })
    }

    // Create friend request
    const friendRequest = new FriendRequest({ senderId, receiverId })
    await friendRequest.save()

    res.status(201).json({
      message: 'Friend request sent',
      friendRequest,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Accept/Reject friend request
export const respondToFriendRequest = async (req, res) => {
  try {
    const { id } = req.params
    const { action } = req.body
    const userId = req.user.id

    // Validate action
    if (!['accepted', 'rejected'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' })
    }

    // Find friend request
    const friendRequest = await FriendRequest.findById(id)
    if (!friendRequest) {
      return res.status(404).json({ message: 'Request not found' })
    }

    // Verify receiver
    if (friendRequest.receiverId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    // Prevent double action
    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Request already responded' })
    }

    // Update request status
    friendRequest.status = action
    await friendRequest.save()

    // If accepted, add both users to friends lists
    if (action === 'accepted') {
      await User.findByIdAndUpdate(
        friendRequest.senderId,
        { $addToSet: { friends: friendRequest.receiverId } },
        { new: true }
      )

      await User.findByIdAndUpdate(
        friendRequest.receiverId,
        { $addToSet: { friends: friendRequest.senderId } },
        { new: true }
      )
    }

    res.json({
      message: `Request ${action}`,
      friendRequest,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Get friends list
export const getFriendsList = async (req, res) => {
  try {
    const userId = req.user.id

    const user = await User.findById(userId).populate('friends', 'name username email')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({
      friends: user.friends,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Get pending friend requests
export const getPendingRequests = async (req, res) => {
  try {
    const userId = req.user.id

    const requests = await FriendRequest.find({
      receiverId: userId,
      status: 'pending',
    })
      .populate('senderId', 'name username email')
      .sort({ createdAt: -1 })

    res.json({
      requests,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Get sent friend requests
export const getSentRequests = async (req, res) => {
  try {
    const userId = req.user.id

    const requests = await FriendRequest.find({
      senderId: userId,
    })
      .populate('receiverId', 'name username email')
      .sort({ createdAt: -1 })

    res.json({
      requests,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Remove friend
export const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params
    const userId = req.user.id

    await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } })

    await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } })

    res.json({ message: 'Friend removed' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}
