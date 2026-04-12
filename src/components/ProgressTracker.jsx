import { useState, useEffect } from 'react'
import { getTaskProgress } from '../services/api'

export default function ProgressTracker() {
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProgress()
    const interval = setInterval(loadProgressSilent, 5000) // Refresh every 5 seconds without flashing
    return () => clearInterval(interval)
  }, [])

  const loadProgress = async () => {
    setLoading(true)
    try {
      const data = await getTaskProgress()
      setProgress(data.progress || [])
      setError('')
    } catch (err) {
      console.error('Failed to load progress')
      setError('Failed to load progress')
    } finally {
      setLoading(false)
    }
  }

  const loadProgressSilent = async () => {
    try {
      const data = await getTaskProgress()
      setProgress(data.progress || [])
      setError('')
    } catch (err) {
      console.error('Failed to load progress')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-600'
      case 'not-completed':
        return 'bg-red-600'
      case 'pending':
        return 'bg-yellow-600'
      default:
        return 'bg-gray-600'
    }
  }

  const getStatusEmoji = (status) => {
    switch (status) {
      case 'completed':
        return '✅'
      case 'not-completed':
        return '❌'
      case 'pending':
        return '⏳'
      default:
        return '❓'
    }
  }

  if (loading && progress.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">📊 Task Progress</h2>
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">📊 Task Progress</h2>
        <button
          onClick={loadProgress}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-semibold transition"
        >
          🔄 Refresh
        </button>
      </div>

      {error && <div className="bg-red-500 text-white p-3 rounded mb-4">{error}</div>}

      {progress.length > 0 ? (
        <div className="space-y-6">
          {progress.map((taskGroup, idx) => (
            <div key={idx} className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-3">{taskGroup.title}</h3>

              <div className="space-y-2">
                {taskGroup.receivers.map((receiver, ridx) => (
                  <div
                    key={ridx}
                    className={`${getStatusColor(
                      receiver.status
                    )} p-3 rounded flex justify-between items-center text-white`}
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{receiver.receiverName}</p>
                      <p className="text-sm opacity-90">@{receiver.receiverUsername}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl">
                        {getStatusEmoji(receiver.status)}
                      </p>
                      <p className="text-xs opacity-90">
                        {receiver.completedAt
                          ? new Date(receiver.completedAt).toLocaleDateString()
                          : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-3 pt-3 border-t border-gray-600">
                {(() => {
                  const completed = taskGroup.receivers.filter(
                    (r) => r.status === 'completed'
                  ).length
                  const total = taskGroup.receivers.length
                  const percentage = Math.round((completed / total) * 100)

                  return (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-300">
                        {completed} of {total} completed
                      </span>
                      <div className="flex-1 mx-3 bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-gray-300 font-semibold">{percentage}%</span>
                    </div>
                  )
                })()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-400 text-lg">📭 No tasks shared yet</p>
          <p className="text-gray-500 text-sm">Send tasks to friends to start tracking progress</p>
        </div>
      )}
    </div>
  )
}
