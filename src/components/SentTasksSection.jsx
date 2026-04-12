import { useState, useEffect } from 'react'
import { getSentTasks } from '../services/api'

export default function SentTasksSection({ refreshTrigger }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all') // all, pending, accepted, rejected

  useEffect(() => {
    loadSentTasks()
  }, [refreshTrigger])

  const loadSentTasks = async () => {
    try {
      setLoading(true)
      const response = await getSentTasks()
      setTasks(response.tasks || [])
    } catch (err) {
      console.error('Failed to load sent tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true
    return task.status === filter
  })

  const getStatusColor = status => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-600'
      case 'accepted':
        return 'bg-green-600'
      case 'rejected':
        return 'bg-red-600'
      default:
        return 'bg-gray-600'
    }
  }

  const getStatusEmoji = status => {
    switch (status) {
      case 'pending':
        return '⏳'
      case 'accepted':
        return '✅'
      case 'rejected':
        return '❌'
      default:
        return '❓'
    }
  }

  if (loading) {
    return <div className="text-gray-400">Loading sent tasks...</div>
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg mb-8">
      <h2 className="text-2xl font-bold mb-4 text-white">
        📤 Tasks You've Sent
        {tasks.length > 0 && (
          <span className="ml-2 bg-blue-600 text-white text-sm px-2 py-1 rounded">
            {tasks.length}
          </span>
        )}
      </h2>

      {tasks.length > 0 && (
        <div className="flex gap-2 mb-4">
          {['all', 'pending', 'accepted', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-sm font-semibold transition ${
                filter === f
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      )}

      {filteredTasks.length === 0 ? (
        <p className="text-gray-400 text-center py-8">
          {filter === 'all' ? 'No tasks sent yet.' : `No ${filter} tasks.`}
        </p>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(task => (
            <div
              key={task._id}
              className="bg-gray-700 p-4 rounded-lg flex items-center gap-4 hover:bg-gray-600 transition"
            >
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold wrap-break-word">{task.title}</p>
                <p className="text-gray-400 text-sm mt-1">
                  To: {task.receiverId?.name || 'Unknown user'}{' '}
                  <span className="text-gray-500">({task.receiverId?.email})</span>
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`${getStatusColor(
                    task.status
                  )} text-white text-sm font-bold px-3 py-1 rounded`}
                >
                  {getStatusEmoji(task.status)} {task.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
