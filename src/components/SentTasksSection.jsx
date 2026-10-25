import { useEffect, useState } from 'react'
import { getSentTasks } from '../services/api'
import { useToast } from './Toast'

export default function SentTasksSection({ refreshTrigger }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')
  const toast = useToast()

  useEffect(() => {
    loadSentTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger])

  const loadSentTasks = async () => {
    try {
      setLoading(true)
      const response = await getSentTasks()
      setTasks(response.tasks || [])
    } catch {
      toast('Failed to load sent tasks', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filteredTasks = tasks.filter((task) => (filter === 'all' ? true : task.status === filter))

  return (
    <div className="border border-line bg-raised p-5 shadow-xs">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-ink uppercase">
            Sent to friends {tasks.length > 0 ? `(${tasks.length})` : ''}
          </h3>
          <p className="text-xs text-muted">Habits you&apos;ve challenged friends to do</p>
        </div>
        {tasks.length > 0 && (
          <div className="flex flex-wrap gap-1 border border-line bg-paper p-0.5">
            {['all', 'pending', 'accepted', 'rejected'].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                  filter === value
                    ? 'bg-ink text-paper shadow-xs'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading sent tasks…</p>
      ) : filteredTasks.length === 0 ? (
        <div className="border border-dashed border-line p-6 text-center">
          <p className="text-sm font-medium text-ink">
            {filter === 'all'
              ? 'You have not sent any tasks to friends yet.'
              : `No ${filter} tasks found.`}
          </p>
          <p className="mt-1 text-xs text-muted">
            Send a habit challenge to your accountability partners to track together.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {filteredTasks.map((task) => (
            <li key={task._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper-2 text-xs font-bold text-ink">
                  {task.receiverId?.name ? task.receiverId.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-ink wrap-break-word">{task.title}</p>
                  <p className="text-xs text-muted">
                    Sent to <span className="font-medium text-ink">{task.receiverId?.name || 'Friend'}</span> (@{task.receiverId?.username})
                  </p>
                </div>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-xs font-medium capitalize shrink-0 ${
                  task.status === 'accepted'
                    ? 'border border-good/30 bg-good/10 text-good'
                    : task.status === 'rejected'
                      ? 'border border-bad/30 bg-bad/10 text-bad'
                      : 'border border-line bg-paper-2 text-muted'
                }`}
              >
                {task.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
