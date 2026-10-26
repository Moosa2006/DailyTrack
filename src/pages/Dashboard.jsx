import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getTasks,
  createTask,
  deleteTask,
  updateTask,
  saveLog,
  getDashboard,
  getLog,
  getIncomingTasks,
  getPendingRequests,
} from '../services/api'
import HabitsView from '../components/HabitsView'
import DailyTasksView from '../components/DailyTasksView'
import DailyNotesView from '../components/DailyNotesView'
import DailyAnalysisView from '../components/DailyAnalysisView'
import ShareModal from '../components/ShareModal'
import SendTaskModal from '../components/SendTaskModal'
import IncomingTasksSection from '../components/IncomingTasksSection'
import SentTasksSection from '../components/SentTasksSection'
import FriendsPanel from '../components/FriendsPanel'
import ProgressTracker from '../components/ProgressTracker'
import AnalyticsModal from '../components/AnalyticsModal'
import { useToast } from '../components/Toast'
import { localDateString } from '../utils/date'

const draftKey = (userId, date) => `dailytrack-draft-${userId}-${date}`

function readUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}')
  } catch {
    return {}
  }
}

function normalizeTasks(log, allTasks) {
  if (log?.exists && Array.isArray(log.tasks) && log.tasks.length > 0) {
    return log.tasks
      .map((item) => {
        const id = item.taskId?._id || item.taskId
        const found = allTasks.find((task) => task._id === id)
        const title = item.title || item.taskId?.title || found?.title || 'Habit'
        const category = item.category || item.taskId?.category || found?.category || 'General'
        if (!id) return null
        return { taskId: id, title, category, completed: Boolean(item.completed) }
      })
      .filter(Boolean)
  }

  return allTasks.map((task) => ({
    taskId: task._id,
    title: task.title,
    category: task.category || 'General',
    completed: false,
  }))
}

export default function Dashboard() {
  const [tab, setTab] = useState('habits') // 'habits' | 'tasks' | 'notes' | 'analysis' | 'shared' | 'friends'
  const [selectedDate, setSelectedDate] = useState(localDateString())
  const [dailyTasks, setDailyTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [syncStatus, setSyncStatus] = useState('idle')
  const [adding, setAdding] = useState(false)
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [stats, setStats] = useState(null)
  const [notes, setNotes] = useState('')
  const [logExists, setLogExists] = useState(false)
  const [dirty, setDirty] = useState(false)

  // Modals & Social
  const [showShareModal, setShowShareModal] = useState(false)
  const [showSendTaskModal, setShowSendTaskModal] = useState(false)
  const [preselectedFriendId, setPreselectedFriendId] = useState(null)
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false)
  const [sharedTasksRefresh, setSharedTasksRefresh] = useState(0)
  const [incomingCount, setIncomingCount] = useState(0)
  const [requestCount, setRequestCount] = useState(0)

  const navigate = useNavigate()
  const toast = useToast()
  const user = readUser()

  const updateCompletion = (items) => {
    const completed = items.filter((task) => task.completed).length
    const percentage = items.length > 0 ? Math.round((completed / items.length) * 100) : 0
    setCompletionPercentage(percentage)
    return percentage
  }

  const persistDraft = (nextTasks, nextNotes) => {
    if (!user.id) return
    localStorage.setItem(
      draftKey(user.id, selectedDate),
      JSON.stringify({ tasks: nextTasks, notes: nextNotes, updatedAt: Date.now() })
    )
  }

  const loadDay = useCallback(
    async (date) => {
      setLoading(true)
      setLoadError('')
      try {
        const [tasksData, dashboardData, logData] = await Promise.all([
          getTasks(),
          getDashboard(date),
          getLog(date),
        ])

        setStats(dashboardData)

        let nextTasks = normalizeTasks(logData, tasksData)
        let nextNotes = logData.notes || ''
        const stored = user.id ? localStorage.getItem(draftKey(user.id, date)) : null
        if (stored) {
          try {
            const draft = JSON.parse(stored)
            if (Array.isArray(draft.tasks)) {
              const draftMap = new Map(draft.tasks.map((task) => [task.taskId, task.completed]))
              nextTasks = nextTasks.map((task) => ({
                ...task,
                completed: draftMap.has(task.taskId) ? draftMap.get(task.taskId) : task.completed,
              }))
            }
            if (typeof draft.notes === 'string') nextNotes = draft.notes
            setDirty(true)
          } catch {
            setDirty(false)
          }
        } else {
          setDirty(false)
        }

        setDailyTasks(nextTasks)
        setNotes(nextNotes)
        setLogExists(Boolean(logData.exists))
        updateCompletion(nextTasks)
      } catch (error) {
        setLoadError(error.message || 'Could not load your tracker.')
      } finally {
        setLoading(false)
      }
    },
    [user.id]
  )

  useEffect(() => {
    loadDay(selectedDate)
  }, [selectedDate, loadDay])

  useEffect(() => {
    if (!dirty) return undefined
    const onBeforeUnload = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  useEffect(() => {
    const loadBadges = async () => {
      try {
        const [incoming, pending] = await Promise.all([getIncomingTasks(), getPendingRequests()])
        setIncomingCount(incoming.tasks?.length || 0)
        setRequestCount(pending.requests?.length || 0)
      } catch {
        // badges are non-blocking
      }
    }
    loadBadges()
  }, [sharedTasksRefresh])

  const addHabit = async (titleToAdd, catToAdd) => {
    if (!titleToAdd || adding) return
    setAdding(true)
    try {
      const newTask = await createTask(titleToAdd, catToAdd)
      const next = [
        ...dailyTasks,
        {
          taskId: newTask._id,
          title: newTask.title,
          category: newTask.category || catToAdd,
          completed: false,
        },
      ]
      setDailyTasks(next)
      updateCompletion(next)
      persistDraft(next, notes)
      setDirty(true)
      toast('Habit added', 'success')

      try {
        await saveLog(selectedDate, next, notes)
        setLogExists(true)
        setDirty(false)
        if (user.id) localStorage.removeItem(draftKey(user.id, selectedDate))
      } catch {
        // non-blocking
      }
    } catch (error) {
      toast(error.message || 'Could not add habit', 'error')
    } finally {
      setAdding(false)
    }
  }

  const toggleHabit = async (taskId) => {
    const next = dailyTasks.map((task) =>
      task.taskId === taskId ? { ...task, completed: !task.completed } : task
    )
    setDailyTasks(next)
    updateCompletion(next)
    persistDraft(next, notes)
    setSyncStatus('saving')

    try {
      await saveLog(selectedDate, next, notes)
      if (user.id) localStorage.removeItem(draftKey(user.id, selectedDate))
      setDirty(false)
      setLogExists(true)
      setSyncStatus('saved')

      const dashboardData = await getDashboard(selectedDate)
      setStats(dashboardData)
      setTimeout(() => setSyncStatus('idle'), 2000)
    } catch {
      setSyncStatus('error')
      setDirty(true)
      toast('Failed to sync. Please try again.', 'error')
    }
  }

  const deleteHabit = async (taskId) => {
    if (!window.confirm('Remove this habit from your checklist?')) return
    try {
      await deleteTask(taskId)
      const next = dailyTasks.filter((task) => task.taskId !== taskId)
      setDailyTasks(next)
      updateCompletion(next)
      persistDraft(next, notes)
      setDirty(true)
      toast('Habit removed')

      try {
        await saveLog(selectedDate, next, notes)
        setDirty(false)
      } catch {
        // non-blocking
      }
    } catch (error) {
      toast(error.message || 'Could not delete habit', 'error')
    }
  }

  const updateHabit = async (taskId, title, category) => {
    try {
      const updated = await updateTask(taskId, title, category)
      setDailyTasks((current) =>
        current.map((task) =>
          task.taskId === taskId
            ? { ...task, title: updated.title, category: updated.category || category }
            : task
        )
      )
      toast('Habit updated', 'success')
    } catch (error) {
      toast(error.message || 'Could not update habit', 'error')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-accent/20">
      {/* Header */}
      <header className="border-b border-line bg-raised shadow-xs sticky top-0 z-30">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-ink text-paper font-display text-base font-bold">
              DT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-wider text-accent uppercase">
                  DailyTrack
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-good" title="Database Connected" />
              </div>
              <h1 className="font-display text-base leading-tight font-semibold text-ink">
                {user.name || 'Dashboard'}
              </h1>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-1.5" aria-label="Primary navigation">
            {[
              { id: 'habits', label: 'Habits' },
              { id: 'tasks', label: 'Daily Tasks' },
              { id: 'notes', label: 'Daily Notes' },
              { id: 'analysis', label: 'Task Analytics' },
              { id: 'shared', label: 'Challenges', count: incomingCount },
              { id: 'friends', label: 'Friends', count: requestCount },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                aria-current={tab === item.id ? 'page' : undefined}
                className={`relative border px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors ${
                  tab === item.id
                    ? 'border-ink bg-ink text-paper shadow-xs'
                    : 'border-line bg-raised text-ink hover:border-ink hover:bg-paper'
                }`}
              >
                {item.label}
                {item.count > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-accent text-white px-1.5 py-0.2 text-[10px] font-bold">
                    {item.count}
                  </span>
                )}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setShowAnalyticsModal(true)}
              className="border border-line bg-raised px-2.5 py-1.5 text-xs font-medium text-ink hover:border-ink transition-colors"
              title="Habit Streaks & Analytics"
            >
              Streaks
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="border border-line bg-raised px-2.5 py-1.5 text-xs text-muted hover:border-ink hover:text-ink transition-colors"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-5xl px-4 py-6">
        {loading && tab === 'habits' ? (
          <div className="py-16 text-center text-muted">
            <div className="mx-auto h-6 w-6 animate-spin border-2 border-line border-t-accent rounded-full mb-3" />
            <p className="text-sm">Loading your habits…</p>
          </div>
        ) : loadError && tab === 'habits' ? (
          <div className="border border-bad/30 bg-raised p-6 shadow-xs">
            <h2 className="font-display text-lg text-bad font-semibold">Unable to load tracker</h2>
            <p className="mt-1 text-sm text-muted">{loadError}</p>
            <button
              type="button"
              onClick={() => loadDay(selectedDate)}
              className="mt-4 bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-ink/90"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* HABITS TAB (Existing feature preserved 100%) */}
            {tab === 'habits' && (
              <HabitsView
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                dailyTasks={dailyTasks}
                completionPercentage={completionPercentage}
                stats={stats}
                syncStatus={syncStatus}
                dirty={dirty}
                logExists={logExists}
                adding={adding}
                onAddTask={addHabit}
                onToggleTask={toggleHabit}
                onDeleteTask={deleteHabit}
                onUpdateTask={updateHabit}
                onOpenShareModal={() => setShowShareModal(true)}
                onOpenSendChallenge={() => {
                  setPreselectedFriendId(null)
                  setShowSendTaskModal(true)
                }}
                onOpenAnalyticsModal={() => setShowAnalyticsModal(true)}
              />
            )}

            {/* DAILY TASKS TAB (New dedicated one-day task workflow) */}
            {tab === 'tasks' && <DailyTasksView initialDate={selectedDate} />}

            {/* DAILY NOTES TAB (New dedicated debounced daily reflections) */}
            {tab === 'notes' && <DailyNotesView initialDate={selectedDate} />}

            {/* TASK ANALYTICS TAB (New daily task analysis & reflection) */}
            {tab === 'analysis' && <DailyAnalysisView initialDate={selectedDate} />}

            {/* SHARED CHALLENGES TAB */}
            {tab === 'shared' && (
              <section className="space-y-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-ink">Shared Challenges</h2>
                    <p className="text-xs text-muted">
                      Send habits to friends, accept accountability challenges, and monitor completion.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPreselectedFriendId(null)
                      setShowSendTaskModal(true)
                    }}
                    className="bg-accent px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-accent-hover"
                  >
                    + Send a Challenge
                  </button>
                </div>

                <IncomingTasksSection
                  refreshTrigger={sharedTasksRefresh}
                  onTaskAccepted={() => {
                    loadDay(selectedDate)
                    setSharedTasksRefresh((prev) => prev + 1)
                  }}
                />

                <SentTasksSection refreshTrigger={sharedTasksRefresh} />

                <ProgressTracker />
              </section>
            )}

            {/* FRIENDS TAB */}
            {tab === 'friends' && (
              <section className="space-y-6">
                <div className="border-b border-line pb-4">
                  <h2 className="font-display text-2xl font-bold text-ink">Friends &amp; Partners</h2>
                  <p className="text-xs text-muted">
                    Build your habit circle. Connect with friends to exchange tasks and stay accountable.
                  </p>
                </div>
                <div className="border border-line bg-raised p-5 shadow-xs">
                  <FriendsPanel
                    onCountsChange={(count) => setRequestCount(count)}
                    onSendTask={(friendId) => {
                      setPreselectedFriendId(friendId)
                      setShowSendTaskModal(true)
                    }}
                  />
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* Modals */}
      {showShareModal && (
        <ShareModal completion={completionPercentage} onClose={() => setShowShareModal(false)} />
      )}

      {showSendTaskModal && (
        <SendTaskModal
          preselectedFriendId={preselectedFriendId}
          onTaskSent={() => setSharedTasksRefresh((prev) => prev + 1)}
          onClose={() => {
            setShowSendTaskModal(false)
            setPreselectedFriendId(null)
          }}
        />
      )}

      {showAnalyticsModal && (
        <AnalyticsModal
          stats={stats}
          habits={dailyTasks}
          onClose={() => setShowAnalyticsModal(false)}
        />
      )}
    </div>
  )
}
