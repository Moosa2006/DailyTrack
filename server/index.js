import app from './app.js'

const PORT = process.env.PORT || 5000
const HOST = '0.0.0.0'

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 DailyTrack server running on http://${HOST}:${PORT} [${process.env.NODE_ENV || 'development'}]`)
})

// Graceful shutdown handling for Render/container environments
const handleShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Gracefully closing HTTP server...`)
  server.close(() => {
    console.log('HTTP server closed.')
    process.exit(0)
  })

  // Force close after 10 seconds if connections refuse to terminate
  setTimeout(() => {
    console.error('Forcefully terminating process after 10s timeout.')
    process.exit(1)
  }, 10000).unref()
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'))
process.on('SIGINT', () => handleShutdown('SIGINT'))

