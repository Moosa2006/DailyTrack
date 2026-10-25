import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import ShareModal from '../components/ShareModal'
import SendTaskModal from '../components/SendTaskModal'
import IncomingTasksSection from '../components/IncomingTasksSection'
import SentTasksSection from '../components/SentTasksSection'
import FriendsPanel from '../components/FriendsPanel'
import ProgressTracker from '../components/ProgressTracker'
import AnalyticsModal from '../components/AnalyticsModal'
import { useToast } from '../components/Toast'
import { addDays, formatDisplayDate, isToday, localDateString, weekdayLabel } from '../utils/date'

const draftKey = (userId, date) => `dailytrack-draft-${userId}-${date}`

const CATEGORIES = ['General', 'Health', 'Focus', 'Fitness', 'Learning', 'Routine']

const STARTER_HABITS = [
  { title: 'Drink 2L of water', category: 'Health' },
  { title: 'Read 20 pages', category: 'Learning' },
  { title: '30-minute workout or walk', category: 'Fitness' },
  { title: 'Deep focus work (60m)', category: 'Focus' },
  { title: 'Evening reflection & plan', category: 'Routine' },
]

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
  const [tab, setTab] = useState('today')
  const [selectedDate, setSelectedDate] = useState(localDateString())
  const [dailyTasks, setDailyTasks] = useState([])
  const [taskInput, setTaskInput] = useState('')
  const [taskCategory, setTaskCategory] = useState('General')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [editingId, setEditingId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingCategory, setEditingCategory] = useState('General')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [syncStatus, setSyncStatus] = useState('idle') // 'idle' | 'saving' | 'saved' | 'error'
  const [adding, setAdding] = useState(false)
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [stats, setStats] = useState(null)
  const [notes, setNotes] = useState('')
  const [logExists, setLogExists] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showSendTaskModal, setShowSendTaskModal] = useState(false)
  const [preselectedFriendId, setPreselectedFriendId] = useState(null)
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false)
  const [sharedTasksRefresh, setSharedTasksRefresh] = useState(0)
  const [incomingCount, setIncomingCount] = useState(0)
  const [requestCount, setRequestCount] = useState(0)
  const dateInputRef = useRef(null)

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

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => addDays(selectedDate, index - 3))
  }, [selectedDate])

  const addTask = async (titleToAdd = null, catToAdd = null) => {
    const title = (titleToAdd || taskInput).trim()
    const category = catToAdd || taskCategory
    if (!title || adding) return

    setAdding(true)
    try {
      const newTask = await createTask(title, category)
      const next = [
        ...dailyTasks,
        {
          taskId: newTask._id,
          title: newTask.title,
          category: newTask.category || category,
          completed: false,
        },
      ]
      setDailyTasks(next)
      updateCompletion(next)
      persistDraft(next, notes)
      if (!titleToAdd) setTaskInput('')
      setDirty(true)
      toast('Habit added', 'success')

      // Save log automatically
      try {
        await saveLog(selectedDate, next, notes)
        setLogExists(true)
        setDirty(false)
        if (user.id) localStorage.removeItem(draftKey(user.id, selectedDate))
      } catch {
        // non-blocking fallback
      }
    } catch (error) {
      toast(error.message || 'Could not add habit', 'error')
    } finally {
      setAdding(false)
    }
  }

  // Real-time optimistic habit toggle with background persistence
  const toggleTask = async (taskId) => {
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

      // Refresh streak stats in background
      const dashboardData = await getDashboard(selectedDate)
      setStats(dashboardData)
      setTimeout(() => setSyncStatus('idle'), 2200)
    } catch {
      setSyncStatus('error')
      setDirty(true)
      toast('Failed to sync. Click Save Day below.', 'error')
    }
  }

  const deleteTaskFn = async (taskId) => {
    if (!window.confirm('Remove this habit from your checklist?')) return
    try {
      await deleteTask(taskId)
      const next = dailyTasks.filter((task) => task.taskId !== taskId)
      setDailyTasks(next)
      updateCompletion(next)
      persistDraft(next, notes)
      setDirty(true)
      toast('Habit removed')

      // Persist log update
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

  const saveEdit = async (taskId) => {
    const title = editingTitle.trim()
    if (!title) {
      setEditingId(null)
      return
    }
    try {
      const updated = await updateTask(taskId, title, editingCategory)
      setDailyTasks((current) =>
        current.map((task) =>
          task.taskId === taskId
            ? { ...task, title: updated.title, category: updated.category || editingCategory }
            : task
        )
      )
      toast('Habit updated', 'success')
    } catch (error) {
      toast(error.message || 'Could not update habit', 'error')
    } finally {
      setEditingId(null)
    }
  }

  const saveDaily = async () => {
    try {
      setSyncStatus('saving')
      await saveLog(selectedDate, dailyTasks, notes)
      if (user.id) localStorage.removeItem(draftKey(user.id, selectedDate))
      setDirty(false)
      setLogExists(true)
      const dashboardData = await getDashboard(selectedDate)
      setStats(dashboardData)
      setSyncStatus('saved')
      toast(isToday(selectedDate) ? 'Today saved' : 'Day saved', 'success')
      setTimeout(() => setSyncStatus('idle'), 2500)
    } catch (error) {
      setSyncStatus('error')
      toast(error.message || 'Failed to save log', 'error')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const completedCount = dailyTasks.filter((task) => task.completed).length

  const filteredHabits = useMemo(() => {
    if (categoryFilter === 'all') return dailyTasks
    return dailyTasks.filter((task) => (task.category || 'General') === categoryFilter)
  }, [dailyTasks, categoryFilter])

  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-accent/20">
      {/* Editorial Header */}
      <header className="border-b border-line bg-raised shadow-xs">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-ink text-paper font-display text-lg font-bold">
              DT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-wider text-accent uppercase">
                  DailyTrack
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-good" title="Database Connected" />
              </div>
              <h1 className="font-display text-xl leading-tight font-semibold text-ink">
                {user.name || 'Your Habits'}
              </h1>
              <p className="text-xs text-muted">
                {user.username ? `@${user.username}` : 'Habits & accountability'}
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2" aria-label="Primary navigation">
            {[
              { id: 'today', label: 'Habits' },
              { id: 'shared', label: 'Challenges', count: incomingCount },
              { id: 'friends', label: 'Friends', count: requestCount },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                aria-current={tab === item.id ? 'page' : undefined}
                className={`relative border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  tab === item.id
                    ? 'border-ink bg-ink text-paper shadow-xs'
                    : 'border-line bg-raised text-ink hover:border-ink'
                }`}
              >
                {item.label}
                {item.count > 0 && (
                  <span
                    className={`ml-2 inline-flex items-center justify-center rounded-full px-1.5 py-0.2 text-[11px] font-bold ${
                      tab === item.id ? 'bg-accent text-white' : 'bg-accent text-white'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setShowAnalyticsModal(true)}
              className="border border-line bg-raised px-3 py-1.5 text-sm font-medium text-ink hover:border-ink transition-colors"
              title="View detailed streaks & analytics"
            >
              Analytics
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="border border-line bg-raised px-3 py-1.5 text-sm text-muted hover:border-ink hover:text-ink transition-colors"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-5xl px-4 py-6">
        {loading ? (
          <div className="py-12 text-center text-muted">
            <div className="mx-auto h-6 w-6 animate-spin border-2 border-line border-t-accent rounded-full mb-3" />
            <p className="text-sm">Loading your habit tracker…</p>
          </div>
        ) : loadError ? (
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
            {/* TODAY / HABITS TAB */}
            {tab === 'today' && (
              <section className="space-y-6">
                {/* 4 Stat Cards */}
                {stats && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {/* Today Completion Card */}
                    <div className="border border-line bg-raised p-4 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold tracking-wider text-muted uppercase">
                          Completion
                        </span>
                        <span className="text-xs font-medium text-good">
                          {completedCount}/{dailyTasks.length}
                        </span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="font-display text-3xl font-bold text-ink">
                          {completionPercentage}%
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden bg-paper-2 rounded-full">
                        <div
                          className="h-full bg-good transition-all duration-300 rounded-full"
                          style={{ width: `${completionPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Week Average Card */}
                    <div className="border border-line bg-raised p-4 shadow-xs">
                      <span className="text-xs font-semibold tracking-wider text-muted uppercase">
                        7-Day Avg
                      </span>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="font-display text-3xl font-bold text-ink">
                          {stats.weeklyAverage}%
                        </span>
                      </div>
                      <p className="mt-2 text-[11px] text-muted">Weekly performance average</p>
                    </div>

                    {/* Current Streak Card */}
                    <div className="border border-line bg-raised p-4 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold tracking-wider text-muted uppercase">
                          Current Streak
                        </span>
                        <span className="text-sm">🔥</span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="font-display text-3xl font-bold text-accent">
                          {stats.currentStreak}
                        </span>
                        <span className="text-xs font-medium text-muted">days</span>
                      </div>
                      <p className="mt-2 text-[11px] text-muted">&ge; 70% daily goal maintains streak</p>
                    </div>

                    {/* Best Streak Card */}
                    <div className="border border-line bg-raised p-4 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold tracking-wider text-muted uppercase">
                          Best Record
                        </span>
                        <span className="text-sm">🏆</span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="font-display text-3xl font-bold text-ink">
                          {stats.longestStreak}
                        </span>
                        <span className="text-xs font-medium text-muted">days</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAnalyticsModal(true)}
                        className="mt-2 text-[11px] font-semibold text-accent hover:underline"
                      >
                        Detailed breakdown &rarr;
                      </button>
                    </div>
                  </div>
                )}

                {/* 30-Day Activity Heatmap */}
                {stats?.history?.length > 0 && (
                  <div className="border border-line bg-raised p-4 shadow-xs">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-xs font-semibold tracking-wider text-muted uppercase">
                        Last 30 Days Consistency
                      </h2>
                      <div className="flex items-center gap-3 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <span className="inline-block h-3 w-3 bg-good" /> &ge; 70% (Streak)
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="inline-block h-3 w-3 bg-warn/70" /> &lt; 70%
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="inline-block h-3 w-3 bg-paper-2 border border-line" /> No log
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1" role="list">
                      {stats.history.map((day) => {
                        const value = day.completionPercentage
                        const intensity =
                          value === null
                            ? 'bg-paper-2 border border-line/60 hover:border-ink'
                            : value >= 70
                              ? 'bg-good text-white'
                              : value > 0
                                ? 'bg-warn/80 text-white'
                                : 'bg-line/70'
                        const isCurrentSelected = selectedDate === day.date
                        return (
                          <button
                            key={day.date}
                            type="button"
                            role="listitem"
                            title={`${day.date}: ${value === null ? 'No log' : `${value}% completed`}`}
                            aria-label={`${day.date}, ${value === null ? 'no log' : `${value} percent`}`}
                            onClick={() => setSelectedDate(day.date)}
                            className={`h-5 w-5 rounded-xs transition-transform hover:scale-115 ${intensity} ${
                              isCurrentSelected
                                ? 'ring-2 ring-ink ring-offset-2 ring-offset-paper scale-110'
                                : ''
                            }`}
                          />
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* 7-Day Calendar Strip & Date Picker */}
                <div className="border border-line bg-raised p-4 shadow-xs">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold tracking-wider text-muted uppercase">
                        Calendar
                      </span>
                      {!isToday(selectedDate) && (
                        <button
                          type="button"
                          onClick={() => setSelectedDate(localDateString())}
                          className="border border-line bg-paper px-2 py-0.5 text-xs font-medium text-accent hover:border-accent transition-colors"
                        >
                          Jump to Today
                        </button>
                      )}
                    </div>

                    {/* Native hidden date picker trigger */}
                    <div className="flex items-center gap-2">
                      <input
                        ref={dateInputRef}
                        type="date"
                        value={selectedDate}
                        onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                        className="sr-only"
                        aria-label="Pick custom date"
                      />
                      <button
                        type="button"
                        onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.focus()}
                        className="border border-line bg-paper px-2.5 py-1 text-xs font-medium text-ink hover:border-ink transition-colors flex items-center gap-1.5"
                      >
                        <span>📅</span> Pick Date
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDate(addDays(selectedDate, -7))}
                      className="border border-line bg-paper px-3 py-2 text-sm font-bold text-ink hover:border-ink transition-colors"
                      aria-label="Previous week"
                    >
                      &lsaquo;
                    </button>

                    <div className="grid flex-1 grid-cols-7 gap-1.5">
                      {weekDays.map((date) => {
                        const isDaySelected = date === selectedDate
                        const dayToday = isToday(date)
                        // Look up completion for this day in history
                        const dayStat = stats?.history?.find((h) => h.date === date)
                        const dayPercent = dayStat?.completionPercentage

                        return (
                          <button
                            key={date}
                            type="button"
                            onClick={() => setSelectedDate(date)}
                            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xs transition-colors ${
                              isDaySelected
                                ? 'bg-ink text-paper shadow-xs font-semibold'
                                : dayToday
                                  ? 'border border-accent bg-accent/5 text-ink'
                                  : 'border border-transparent bg-paper/60 text-muted hover:border-line hover:text-ink'
                            }`}
                          >
                            <span className="text-[11px] uppercase tracking-wider">
                              {weekdayLabel(date)}
                            </span>
                            <span className="mt-0.5 text-sm font-display font-medium">
                              {date.slice(-2)}
                            </span>
                            {/* Day Status Dot */}
                            <span
                              className={`mt-1 h-1.5 w-1.5 rounded-full ${
                                dayPercent >= 70
                                  ? isDaySelected ? 'bg-good' : 'bg-good'
                                  : dayPercent > 0
                                    ? 'bg-warn'
                                    : 'bg-transparent'
                              }`}
                            />
                          </button>
                        )
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedDate(addDays(selectedDate, 7))}
                      className="border border-line bg-paper px-3 py-2 text-sm font-bold text-ink hover:border-ink transition-colors"
                      aria-label="Next week"
                    >
                      &rsaquo;
                    </button>
                  </div>
                </div>

                {/* Day Header & Actions */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-line pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-2xl font-bold text-ink">
                        {formatDisplayDate(selectedDate)}
                      </h2>
                      {isToday(selectedDate) && (
                        <span className="border border-accent/40 bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                          Today
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-muted">
                        {logExists ? 'Saved in daily log.' : 'No log recorded yet.'}
                      </p>
                      {/* Live Sync Status Indicator */}
                      {syncStatus === 'saving' && (
                        <span className="text-xs text-muted flex items-center gap-1">
                          <span className="inline-block h-2 w-2 animate-ping bg-accent rounded-full" />
                          Saving…
                        </span>
                      )}
                      {syncStatus === 'saved' && (
                        <span className="text-xs text-good font-medium">✓ Saved</span>
                      )}
                      {dirty && syncStatus === 'idle' && (
                        <span className="text-xs text-warn font-medium">• Unsaved changes</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowShareModal(true)}
                      className="border border-line bg-raised px-3 py-1.5 text-xs font-medium text-ink hover:border-ink transition-colors flex items-center gap-1.5"
                    >
                      <span>📤</span> Share {completionPercentage}%
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSendTaskModal(true)}
                      className="border border-line bg-raised px-3 py-1.5 text-xs font-medium text-ink hover:border-ink transition-colors flex items-center gap-1.5"
                    >
                      <span>🤝</span> Send challenge
                    </button>
                  </div>
                </div>

                {/* Add Habit Form */}
                <div className="border border-line bg-raised p-4 shadow-xs">
                  <label htmlFor="new-habit" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
                    Add a new habit
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      id="new-habit"
                      type="text"
                      value={taskInput}
                      onChange={(event) => setTaskInput(event.target.value)}
                      onKeyDown={(event) => event.key === 'Enter' && addTask()}
                      placeholder="e.g. Morning meditation 15 mins"
                      maxLength={200}
                      className="flex-1 border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-accent"
                    />
                    <select
                      value={taskCategory}
                      onChange={(e) => setTaskCategory(e.target.value)}
                      className="border border-line bg-paper px-3 py-2 text-xs font-medium text-ink"
                      aria-label="Habit Category"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => addTask()}
                      disabled={adding || !taskInput.trim()}
                      className="bg-accent px-5 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-accent-hover disabled:opacity-50"
                    >
                      {adding ? 'Adding…' : 'Add Habit'}
                    </button>
                  </div>
                </div>

                {/* Category Filter Pills (if multiple habits) */}
                {dailyTasks.length > 3 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-muted mr-1">Filter:</span>
                    <button
                      type="button"
                      onClick={() => setCategoryFilter('all')}
                      className={`px-2.5 py-1 text-xs font-medium rounded-xs transition-colors ${
                        categoryFilter === 'all'
                          ? 'bg-ink text-paper'
                          : 'border border-line bg-raised text-muted hover:text-ink'
                      }`}
                    >
                      All ({dailyTasks.length})
                    </button>
                    {CATEGORIES.filter((c) => dailyTasks.some((t) => (t.category || 'General') === c)).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-xs transition-colors ${
                          categoryFilter === cat
                            ? 'bg-ink text-paper'
                            : 'border border-line bg-raised text-muted hover:text-ink'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                {/* Habits List */}
                {dailyTasks.length === 0 ? (
                  <div className="border border-dashed border-line bg-raised/50 px-6 py-10 text-center shadow-xs">
                    <p className="font-display text-lg font-semibold text-ink">No habits added yet</p>
                    <p className="mx-auto mt-1 max-w-md text-xs text-muted">
                      Start building consistent daily routines. Choose from recommended habits or type your own above.
                    </p>
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                      {STARTER_HABITS.map((starter) => (
                        <button
                          key={starter.title}
                          type="button"
                          onClick={() => addTask(starter.title, starter.category)}
                          className="border border-line bg-raised px-3 py-1.5 text-xs font-medium text-ink hover:border-ink hover:bg-paper transition-colors"
                        >
                          + {starter.title}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : filteredHabits.length === 0 ? (
                  <div className="border border-dashed border-line p-6 text-center text-sm text-muted">
                    No habits under the &ldquo;{categoryFilter}&rdquo; category.
                  </div>
                ) : (
                  <div className="border border-line bg-raised shadow-xs">
                    <ul className="divide-y divide-line">
                      {filteredHabits.map((task) => {
                        const isDone = task.completed
                        return (
                          <li
                            key={task.taskId}
                            className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 transition-colors ${
                              isDone ? 'bg-paper/30' : 'hover:bg-paper/20'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {/* Custom Interactive Checkbox */}
                              <button
                                type="button"
                                role="checkbox"
                                aria-checked={isDone}
                                onClick={() => toggleTask(task.taskId)}
                                className={`flex h-5 w-5 shrink-0 items-center justify-center border transition-all ${
                                  isDone
                                    ? 'border-good bg-good text-white'
                                    : 'border-ink/50 bg-paper hover:border-ink'
                                }`}
                                aria-label={`Toggle habit: ${task.title}`}
                              >
                                {isDone && (
                                  <svg
                                    className="h-3.5 w-3.5 stroke-current stroke-2 fill-none"
                                    viewBox="0 0 24 24"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </button>

                              {/* Title or Inline Edit */}
                              {editingId === task.taskId ? (
                                <div className="flex flex-1 items-center gap-2">
                                  <input
                                    value={editingTitle}
                                    onChange={(event) => setEditingTitle(event.target.value)}
                                    onBlur={() => saveEdit(task.taskId)}
                                    onKeyDown={(event) => {
                                      if (event.key === 'Enter') saveEdit(task.taskId)
                                      if (event.key === 'Escape') setEditingId(null)
                                    }}
                                    className="flex-1 border border-accent bg-paper px-2 py-1 text-sm text-ink outline-none"
                                    autoFocus
                                  />
                                  <select
                                    value={editingCategory}
                                    onChange={(e) => setEditingCategory(e.target.value)}
                                    className="border border-line bg-paper px-2 py-1 text-xs"
                                  >
                                    {CATEGORIES.map((c) => (
                                      <option key={c} value={c}>
                                        {c}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : (
                                <div className="min-w-0 flex-1 flex flex-wrap items-center gap-2">
                                  <span
                                    onClick={() => toggleTask(task.taskId)}
                                    className={`cursor-pointer text-sm font-medium transition-colors select-none ${
                                      isDone ? 'text-muted line-through opacity-70' : 'text-ink'
                                    }`}
                                  >
                                    {task.title}
                                  </span>
                                  {task.category && task.category !== 'General' && (
                                    <span className="border border-line bg-paper-2/70 px-1.5 py-0.2 text-[10px] font-semibold text-muted uppercase tracking-wider">
                                      {task.category}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Row Action Buttons */}
                            <div className="flex items-center gap-3 shrink-0">
                              {editingId !== task.taskId && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingId(task.taskId)
                                    setEditingTitle(task.title)
                                    setEditingCategory(task.category || 'General')
                                  }}
                                  className="text-xs text-muted hover:text-ink transition-colors"
                                >
                                  Rename
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => deleteTaskFn(task.taskId)}
                                className="text-xs text-muted hover:text-bad transition-colors"
                                aria-label={`Delete habit: ${task.title}`}
                              >
                                Delete
                              </button>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}

                {/* Notes & Reflection Section */}
                <div className="border border-line bg-raised p-5 shadow-xs">
                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="notes" className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Daily Reflections &amp; Notes
                    </label>
                    <span className="text-[11px] text-muted">{notes.length}/2000</span>
                  </div>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(event) => {
                      setNotes(event.target.value)
                      persistDraft(dailyTasks, event.target.value)
                      setDirty(true)
                    }}
                    onBlur={() => {
                      if (dirty) saveDaily()
                    }}
                    placeholder="What went well today? What challenges or obstacles arose?"
                    maxLength={2000}
                    className="h-24 w-full border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted/60"
                  />
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-muted">
                      Notes save automatically when you finish typing and leave the box.
                    </p>
                    <button
                      type="button"
                      onClick={saveDaily}
                      disabled={syncStatus === 'saving'}
                      className="bg-ink px-4 py-2 text-xs font-semibold text-paper shadow-xs transition-colors hover:bg-ink/90 disabled:opacity-60"
                    >
                      {syncStatus === 'saving'
                        ? 'Saving…'
                        : `Save Day (${completionPercentage}%)`}
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* SHARED TAB */}
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
