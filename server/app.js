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

const createApp = () => {
  const app = express()

  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  )
  app.use(express.json())

  connectDB()

  app.get('/api', (req, res) => {
    res.json({ message: 'API is running' })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/tasks', taskRoutes)
  app.use('/api/log', logRoutes)
  app.use('/api/dashboard', dashboardRoutes)
  app.use('/api/shared', sharedTaskRoutes)
  app.use('/api/friends', friendRoutes)
  app.use('/api/users', userRoutes)

  return app
}

const app = createApp()

export default app
export { createApp }
