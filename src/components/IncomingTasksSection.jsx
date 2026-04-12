import { useState, useEffect } from 'react'
import { getIncomingTasks, respondToSharedTask } from '../services/api'

export default function IncomingTasksSection({ refreshTrigger, onTaskAccepted }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [respondingTo, setRespondingTo] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadIncomingTasks()
  }, [refreshTrigger])

  const loadIncomingTasks = async () => {
    try {
      setLoading(true)
      const response = await getIncomingTasks()
      setTasks(response.tasks || [])
    } catch (err) {
      setError('Failed to load incoming tasks')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRespond = async (taskId, action) => {
    try {
      setRespondingTo(taskId)
      const response = await respondToSharedTask(taskId, action)

      if (response.message) {
        // Remove task from list
        setTasks(tasks.filter(t => t._id !== taskId))

        // Trigger callback to refresh main task list if accepted
        if (action === 'accepted' && onTaskAccepted) {
          onTaskAccepted()
        }

        setError('')
      } else {
        setError(response.message || 'Failed to respond')
      }
    } catch (err) {
      setError('Failed to respond to task')
      console.error(err)
    } finally {
      setRespondingTo(null)
    }
  }

  if (loading) {
    return <div className="text-gray-400">Loading incoming tasks...</div>
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg mb-8">
      <h2 className="text-2xl font-bold mb-4 text-white">
        📨 Incoming Task Requests
        {tasks.length > 0 && (
          <span className="ml-2 bg-green-600 text-white text-sm px-2 py-1 rounded">
            {tasks.length}
          </span>
        )}
      </h2>

      {error && (
        <div className="bg-red-500 text-white p-3 rounded mb-4">{error}</div>
      )}

      {tasks.length === 0 ? (
        <p className="text-gray-400 text-center py-8">
          No pending task requests. You're all caught up! ✨
        </p>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => (
            <div
              key={task._id}
              className="bg-gray-700 p-4 rounded-lg flex items-start gap-4 hover:bg-gray-600 transition"
            >
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold wrap-break-word">{task.title}</p>
                <p className="text-gray-400 text-sm mt-1">
                  From: {task.senderId?.name || 'Unknown user'}{' '}
                  <span className="text-gray-500">({task.senderId?.email})</span>
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  {new Date(task.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleRespond(task._id, 'accepted')}
                  disabled={respondingTo === task._id}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded transition text-sm whitespace-nowrap"
                >
                  {respondingTo === task._id ? '...' : 'Accept'}
                </button>
                <button
                  onClick={() => handleRespond(task._id, 'rejected')}
                  disabled={respondingTo === task._id}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded transition text-sm whitespace-nowrap"
                >
                  {respondingTo === task._id ? '...' : 'Reject'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
