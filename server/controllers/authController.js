import User from '../models/User.js'
import jwt from 'jsonwebtoken'

export const signup = async (req, res) => {
  try {
    const { name, username, email, password } = req.body

    // Validate inputs
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    // Validate username format
    const usernameRegex = /^[a-z0-9_-]{3,20}$/
    if (!usernameRegex.test(username.toLowerCase())) {
      return res.status(400).json({
        message: 'Username must be 3-20 characters, alphanumeric with underscores/dashes only',
      })
    }

    // Check if user exists by email or username
    const existingUser = await User.findOne({
      $or: [{ email }, { username: username.toLowerCase() }],
    })
    if (existingUser) {
      return res.status(409).json({
        message: existingUser.email === email ? 'Email already in use' : 'Username already taken',
      })
    }

    // Create new user
    const user = new User({ name, username: username.toLowerCase(), email, password })
    await user.save()

    // Generate JWT token
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    })

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: user._id, name: user.name, username: user.username, email: user.email },
    })
  } catch (error) {
    // Handle MongoDB duplicate key error (shouldn't occur with validation above, but defensive)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      const message = field === 'email' ? 'Email already in use' : 'Username already taken'
      return res.status(409).json({ message })
    }
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    // Check password
    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Wrong password' })
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    })

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, username: user.username, email: user.email },
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}
