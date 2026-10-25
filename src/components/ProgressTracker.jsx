import { useEffect, useState } from 'react'
import { getTaskProgress } from '../services/api'

export default function ProgressTracker() {
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadProgress = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const data = await getTaskProgress()
      setProgress(data.progress || [])
      setError('')
    } catch {
      if (!silent) setError('Failed to load progress')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProgress()
    const interval = setInterval(() => loadProgress(true), 20000)
    return () => clearInterval(interval)
  }, [])

  const statusLabel = (status) => {
    if (status === 'completed') return 'Done'
    if (status === 'not-completed') return 'Not done'
    return 'Pending'
  }

  return (
    <div className="border border-line bg-raised p-5 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-ink uppercase">
            Accountability &amp; Friend Progress
          </h3>
          <p className="text-xs text-muted">See who completed shared challenges</p>
        </div>
        <button
          type="button"
          onClick={() => loadProgress()}
          className="border border-line bg-paper px-2.5 py-1 text-xs font-medium text-ink hover:border-ink transition-colors"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && <div className="mb-3 border border-bad/30 bg-bad/10 px-3 py-2 text-xs text-bad">{error}</div>}

      {loading && progress.length === 0 ? (
        <p className="text-sm text-muted">Checking friend progress…</p>
      ) : progress.length > 0 ? (
        <div className="space-y-5">
          {progress.map((taskGroup) => {
            const completed = taskGroup.receivers.filter((receiver) => receiver.status === 'completed').length
            const total = taskGroup.receivers.length
            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

            return (
              <div key={taskGroup.title} className="border-t border-line pt-4 first:border-t-0 first:pt-0">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-medium text-ink">{taskGroup.title}</h4>
                  <span className="text-xs font-semibold text-muted">
                    {completed} of {total} completed ({percentage}%)
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden bg-paper-2 rounded-full" aria-hidden="true">
                  <div
                    className="h-full bg-good transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <ul className="mt-3 divide-y divide-line/60">
                  {taskGroup.receivers.map((receiver) => (
                    <li
                      key={`${taskGroup.title}-${receiver.receiverId}`}
                      className="flex items-center justify-between py-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-paper-2 font-bold text-ink text-[10px]">
                          {receiver.receiverName ? receiver.receiverName.charAt(0).toUpperCase() : '?'}
                        </div>
                        <span className="font-medium text-ink">{receiver.receiverName}</span>
                        <span className="text-muted">@{receiver.receiverUsername}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-xs font-medium ${
                          receiver.status === 'completed'
                            ? 'border border-good/30 bg-good/10 text-good'
                            : 'border border-line bg-paper text-muted'
                        }`}
                      >
                        {statusLabel(receiver.status)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="border border-dashed border-line p-6 text-center">
          <p className="text-sm font-medium text-ink">No accepted shared tasks yet</p>
          <p className="mt-1 text-xs text-muted">
            Send a task to your friends. Once they accept, their daily completion will track here live!
          </p>
        </div>
      )}
    </div>
  )
}
