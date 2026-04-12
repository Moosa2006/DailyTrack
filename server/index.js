import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import taskRoutes from './routes/taskRoutes.js'
import logRoutes from './routes/logRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import sharedTaskRoutes from './routes/sharedTaskRoutes.js'
import friendRoutes from './routes/friendRoutes.js'
import userRoutes from './routes/userRoutes.js'

dotenv.config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Connect to MongoDB
connectDB()

// Test Route
app.get('/', (req, res) => {
  res.json({ message: 'API is running' })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/log', logRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/shared', sharedTaskRoutes)
app.use('/api/friends', friendRoutes)
app.use('/api/users', userRoutes)

// Start Server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
