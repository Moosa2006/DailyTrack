import User from '../models/User.js'

// Search users by username
export const searchUsers = async (req, res) => {
  try {
    const { username } = req.query
    const userId = req.user.id

    if (!username || username.trim().length === 0) {
      return res.status(400).json({ message: 'Username search term required' })
    }

    // Search for users with partial username match (case-insensitive)
    const users = await User.find(
      {
        username: { $regex: username.toLowerCase(), $options: 'i' },
        _id: { $ne: userId }, // Exclude current user
      },
      'name username email _id'
    ).limit(20)

    res.json({
      results: users,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Get user profile by username
export const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params

    const user = await User.findOne({ username: username.toLowerCase() })
      .select('name username email createdAt')
      .populate('friends', 'name username')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json(user)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Get current user profile
export const getCurrentUserProfile = async (req, res) => {
  try {
    const userId = req.user.id

    const user = await User.findById(userId)
      .select('name username email _id createdAt')
      .populate('friends', 'name username _id')

    res.json(user)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}
