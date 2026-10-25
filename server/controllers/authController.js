import User from '../models/User.js'
import jwt from 'jsonwebtoken'

const signToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured')
  }

  return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  })
}

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
})

export const signup = async (req, res) => {
  try {
    const { name, username, email, password } = req.body

    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    const trimmedName = String(name).trim()
    const normalizedUsername = String(username).trim().toLowerCase()
    const normalizedEmail = String(email).trim().toLowerCase()

    if (trimmedName.length < 1 || trimmedName.length > 60) {
      return res.status(400).json({ message: 'Name must be 1-60 characters' })
    }

    if (!/^[a-z0-9_-]{3,20}$/.test(normalizedUsername)) {
      return res.status(400).json({
        message: 'Username must be 3-20 characters, letters, numbers, underscores, or dashes',
      })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Enter a valid email address' })
    }

    if (String(password).length < 6 || String(password).length > 128) {
      return res.status(400).json({ message: 'Password must be 6-128 characters' })
    }

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    })
    if (existingUser) {
      return res.status(409).json({
        message:
          existingUser.email === normalizedEmail ? 'Email already in use' : 'Username already taken',
      })
    }

    const user = new User({
      name: trimmedName,
      username: normalizedUsername,
      email: normalizedEmail,
      password,
    })
    await user.save()

    const token = signToken(user)

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: publicUser(user),
    })
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || { username: 1 })[0]
      const message = field === 'email' ? 'Email already in use' : 'Username already taken'
      return res.status(409).json({ message })
    }
    if (error.message === 'JWT_SECRET is not configured') {
      return res.status(500).json({ message: 'Server configuration error' })
    }
    res.status(500).json({ message: 'Server error' })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() })
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const token = signToken(user)

    res.json({
      message: 'Login successful',
      token,
      user: publicUser(user),
    })
  } catch (error) {
    if (error.message === 'JWT_SECRET is not configured') {
      return res.status(500).json({ message: 'Server configuration error' })
    }
    res.status(500).json({ message: 'Server error' })
  }
}
