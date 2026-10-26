import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import connectDB from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import taskRoutes from './routes/taskRoutes.js'
import logRoutes from './routes/logRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import sharedTaskRoutes from './routes/sharedTaskRoutes.js'
import friendRoutes from './routes/friendRoutes.js'
import userRoutes from './routes/userRoutes.js'
import dailyTaskRoutes from './routes/dailyTaskRoutes.js'
import dailyNoteRoutes from './routes/dailyNoteRoutes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config()
dotenv.config({ path: path.join(__dirname, '.env') })

const createApp = () => {
  const app = express()

  // Parse allowed origins from environment variable (supports comma-separated list)
  const configuredOrigins = (process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, Render health checks)
        if (!origin) return callback(null, true)

        // Always allow localhost during non-production runs
        if (process.env.NODE_ENV !== 'production') {
          if (
            /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
            /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)
          ) {
            return callback(null, true)
          }
        }

        // If no explicit origins configured, allow all origins
        if (configuredOrigins.length === 0) {
          return callback(null, true)
        }

        // Allow configured production origins
        if (configuredOrigins.includes(origin)) {
          return callback(null, true)
        }

        // Allow Vercel preview branch deployments (*.vercel.app)
        if (origin.endsWith('.vercel.app')) {
          return callback(null, true)
        }

        return callback(new Error(`CORS policy blocked access from origin: ${origin}`))
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  )
  app.use(express.json({ limit: '32kb' }))

  connectDB()

  // Health check endpoints for Render and uptime monitoring
  app.get(['/health', '/api/health'], (req, res) => {
    const isDbConnected = mongoose.connection.readyState === 1
    res.status(isDbConnected || !process.env.MONGO_URI ? 200 : 503).json({
      status: isDbConnected ? 'ok' : 'degraded',
      db: isDbConnected ? 'connected' : 'disconnected',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    })
  })

  app.get('/api', (req, res) => {
    res.json({ message: 'DailyTrack API is running', version: '1.0.0' })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/tasks', taskRoutes)
  app.use('/api/log', logRoutes)
  app.use('/api/dashboard', dashboardRoutes)
  app.use('/api/shared', sharedTaskRoutes)
  app.use('/api/friends', friendRoutes)
  app.use('/api/users', userRoutes)
  app.use('/api/daily-tasks', dailyTaskRoutes)
  app.use('/api/daily-notes', dailyNoteRoutes)

  app.use((req, res) => {
    res.status(404).json({ message: 'Not found' })
  })

  // Global error handler to prevent HTML stack leaks in production
  app.use((err, req, res, _next) => {
    console.error('Unhandled server error:', err)
    const status = err.status || err.statusCode || 500
    res.status(status).json({
      message:
        process.env.NODE_ENV === 'production' && status === 500
          ? 'Internal server error'
          : err.message || 'Internal server error',
    })
  })

  return app
}

const app = createApp()

export default app
export { createApp }
