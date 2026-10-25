import User from '../models/User.js'
import FriendRequest from '../models/FriendRequest.js'

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const searchUsers = async (req, res) => {
  try {
    const { username } = req.query
    const userId = req.user.id

    if (!username || String(username).trim().length === 0) {
      return res.status(400).json({ message: 'Username search term required' })
    }

    const term = escapeRegex(String(username).trim().toLowerCase()).slice(0, 20)

    const [users, currentUser, pendingRequests] = await Promise.all([
      User.find(
        {
          username: { $regex: term, $options: 'i' },
          _id: { $ne: userId },
        },
        'name username _id'
      ).limit(20),
      User.findById(userId).select('friends'),
      FriendRequest.find({
        $or: [
          { senderId: userId, status: 'pending' },
          { receiverId: userId, status: 'pending' },
        ],
      }),
    ])

    const friendIdStrings = new Set((currentUser?.friends || []).map((id) => id.toString()))
    const sentPendingSet = new Set(
      pendingRequests
        .filter((r) => r.senderId.toString() === userId.toString())
        .map((r) => r.receiverId.toString())
    )
    const receivedPendingMap = new Map(
      pendingRequests
        .filter((r) => r.receiverId.toString() === userId.toString())
        .map((r) => [r.senderId.toString(), r._id.toString()])
    )

    const results = users.map((u) => {
      const uId = u._id.toString()
      let relationship = 'none'
      let requestId = null

      if (friendIdStrings.has(uId)) {
        relationship = 'friend'
      } else if (sentPendingSet.has(uId)) {
        relationship = 'pending_sent'
      } else if (receivedPendingMap.has(uId)) {
        relationship = 'pending_received'
        requestId = receivedPendingMap.get(uId)
      }

      return {
        _id: u._id,
        name: u.name,
        username: u.username,
        relationship,
        requestId,
      }
    })

    res.json({
      results,
    })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
}

export const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params

    const user = await User.findOne({ username: String(username).toLowerCase() }).select(
      'name username createdAt friends'
    )

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({
      name: user.name,
      username: user.username,
      createdAt: user.createdAt,
      friendsCount: user.friends?.length || 0,
    })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
}

export const getCurrentUserProfile = async (req, res) => {
  try {
    const userId = req.user.id

    const user = await User.findById(userId)
      .select('name username email _id createdAt')
      .populate('friends', 'name username _id')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json(user)
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
}
