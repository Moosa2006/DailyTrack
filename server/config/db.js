import mongoose from 'mongoose'

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.warn('MONGO_URI is not set. Skipping database connection for now.')
    return null
  }

  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI)
    console.log(`MongoDB connected: ${conn.connection.host}`)
    return conn
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`)
    return null
  }
}

export default connectDB
