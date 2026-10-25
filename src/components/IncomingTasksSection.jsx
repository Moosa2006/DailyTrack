import { useEffect, useState } from 'react'
import { getIncomingTasks, respondToSharedTask } from '../services/api'
import { useToast } from './Toast'

export default function IncomingTasksSection({ refreshTrigger, onTaskAccepted }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [respondingTo, setRespondingTo] = useState(null)
  const toast = useToast()

  useEffect(() => {
    loadIncomingTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger])

  const loadIncomingTasks = async () => {
    try {
      setLoading(true)
      const response = await getIncomingTasks()
      setTasks(response.tasks || [])
    } catch {
      toast('Failed to load incoming tasks', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRespond = async (taskId, action) => {
    try {
      setRespondingTo(taskId)
      await respondToSharedTask(taskId, action)
      setTasks((current) => current.filter((task) => task._id !== taskId))
      if (action === 'accepted') {
        onTaskAccepted?.()
        toast('Task added to your habits', 'success')
      } else {
        toast('Request declined')
      }
    } catch (err) {
      toast(err.message || `Failed to ${action} task`, 'error')
      loadIncomingTasks()
    } finally {
      setRespondingTo(null)
    }
  }

  return (
    <div className="border border-line bg-raised p-5 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-ink uppercase">
          Incoming challenges &amp; habits
        </h3>
        {tasks.length > 0 && (
          <span className="border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
            {tasks.length} waiting
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading incoming tasks…</p>
      ) : tasks.length === 0 ? (
        <div className="border border-dashed border-line p-6 text-center">
          <p className="text-sm font-medium text-ink">No incoming challenges right now</p>
          <p className="mt-1 text-xs text-muted">
            When friends send you a habit or accountability challenge, it will appear here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {tasks.map((task) => (
            <li key={task._id} className="flex flex-wrap items-center justify-between gap-4 py-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper-2 text-sm font-bold text-ink">
                  {task.senderId?.name ? task.senderId.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-ink wrap-break-word">{task.title}</p>
                  <p className="text-xs text-muted">
                    Sent by <span className="font-medium text-ink">{task.senderId?.name || 'Friend'}</span> (@{task.senderId?.username})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleRespond(task._id, 'accepted')}
                  disabled={respondingTo === task._id}
                  className="bg-accent px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-accent-hover disabled:opacity-60"
                >
                  {respondingTo === task._id ? 'Accepting…' : 'Accept & Track'}
                </button>
                <button
                  type="button"
                  onClick={() => handleRespond(task._id, 'rejected')}
                  disabled={respondingTo === task._id}
                  className="border border-line bg-raised px-3 py-1.5 text-xs text-muted transition-colors hover:border-ink hover:text-ink disabled:opacity-60"
                >
                  Decline
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
