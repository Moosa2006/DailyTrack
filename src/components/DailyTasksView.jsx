import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createDailyTask,
  getDailyTasks,
  updateDailyTask,
  toggleDailyTask,
  deleteDailyTask,
} from '../services/api'
import { useToast } from './Toast'
import { addDays, formatDisplayDate, isToday, localDateString, weekdayLabel } from '../utils/date'

const TASK_CATEGORIES = ['General', 'Study', 'Work', 'Project', 'Assignment', 'Personal', 'Errands']

const PRIORITY_CONFIG = {
  high: { label: 'High', color: 'bg-bad/10 text-bad border-bad/30', dot: 'bg-bad' },
  medium: { label: 'Medium', color: 'bg-warn/10 text-warn border-warn/30', dot: 'bg-warn' },
  low: { label: 'Low', color: 'bg-paper-2 text-muted border-line', dot: 'bg-muted' },
}

export default function DailyTasksView({ initialDate }) {
  const [selectedDate, setSelectedDate] = useState(initialDate || localDateString())
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // 'all' | 'pending' | 'completed' | 'high' | 'medium' | 'low'
  const [showAddForm, setShowAddForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // New task form fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [category, setCategory] = useState('General')

  // Inline edit state
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPriority, setEditPriority] = useState('medium')
  const [editCategory, setEditCategory] = useState('General')

  const dateInputRef = useRef(null)
  const toast = useToast()

  const loadTasks = async (date) => {
    setLoading(true)
    setError('')
    try {
      const data = await getDailyTasks(date)
      setTasks(data.tasks || [])
    } catch (err) {
      setError(err.message || 'Failed to load daily tasks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks(selectedDate)
  }, [selectedDate])

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => addDays(selectedDate, index - 3))
  }, [selectedDate])

  const handleCreate = async (e) => {
    e?.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle || submitting) return

    setSubmitting(true)
    try {
      const created = await createDailyTask({
        title: trimmedTitle,
        description: description.trim(),
        date: selectedDate,
        priority,
        category,
      })
      setTasks((prev) => [created, ...prev])
      setTitle('')
      setDescription('')
      setPriority('medium')
      setCategory('General')
      setShowAddForm(false)
      toast('Daily task created', 'success')
    } catch (err) {
      toast(err.message || 'Could not create task', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (id) => {
    // Optimistic toggle
    setTasks((prev) =>
      prev.map((t) => (t._id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : null } : t))
    )
    try {
      const updated = await toggleDailyTask(id)
      setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)))
    } catch (err) {
      // Revert on error
      setTasks((prev) =>
        prev.map((t) => (t._id === id ? { ...t, completed: !t.completed } : t))
      )
      toast(err.message || 'Failed to update task status', 'error')
    }
  }

  const handleDelete = async (id, taskTitle) => {
    if (!window.confirm(`Delete daily task "${taskTitle}"?`)) return
    try {
      await deleteDailyTask(id)
      setTasks((prev) => prev.filter((t) => t._id !== id))
      toast('Task deleted')
    } catch (err) {
      toast(err.message || 'Failed to delete task', 'error')
    }
  }

  const handleStartEdit = (task) => {
    setEditingId(task._id)
    setEditTitle(task.title)
    setEditDescription(task.description || '')
    setEditPriority(task.priority || 'medium')
    setEditCategory(task.category || 'General')
  }

  const handleSaveEdit = async (id) => {
    const trimmed = editTitle.trim()
    if (!trimmed) {
      setEditingId(null)
      return
    }
    try {
      const updated = await updateDailyTask(id, {
        title: trimmed,
        description: editDescription.trim(),
        priority: editPriority,
        category: editCategory,
      })
      setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)))
      setEditingId(null)
      toast('Task updated', 'success')
    } catch (err) {
      toast(err.message || 'Could not update task', 'error')
    }
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filter === 'pending') return !task.completed
      if (filter === 'completed') return task.completed
      if (['high', 'medium', 'low'].includes(filter)) return task.priority === filter
      return true
    })
  }, [tasks, filter])

  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((t) => t.completed).length
    const remaining = total - completed
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
    const highRemaining = tasks.filter((t) => !t.completed && t.priority === 'high').length
    return { total, completed, remaining, percentage, highRemaining }
  }, [tasks])

  return (
    <section className="space-y-6">
      {/* 7-Day Date Strip & Calendar Picker */}
      <div className="border border-line bg-raised p-4 shadow-xs">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider text-muted uppercase">
              Schedule Date
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

      {/* Date Title & Top Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl font-bold text-ink">
              {formatDisplayDate(selectedDate)}
            </h2>
            {isToday(selectedDate) ? (
              <span className="border border-accent/40 bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                Today
              </span>
            ) : (
              <span className="border border-line bg-paper px-2 py-0.5 text-xs text-muted">
                Historical / Planned Date
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted">
            Daily tasks scheduled for this day ({stats.completed} of {stats.total} completed).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-accent px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-accent-hover self-start sm:self-auto"
        >
          {showAddForm ? '✕ Cancel' : '+ Add Daily Task'}
        </button>
      </div>

      {/* Quick Summary Pill Bar */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="border border-line bg-raised p-3 shadow-xs">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Tasks Planned</span>
            <p className="font-display text-2xl font-bold text-ink mt-1">{stats.total}</p>
          </div>
          <div className="border border-line bg-raised p-3 shadow-xs">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Completed</span>
            <p className="font-display text-2xl font-bold text-good mt-1">{stats.completed}</p>
          </div>
          <div className="border border-line bg-raised p-3 shadow-xs">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Remaining</span>
            <p className="font-display text-2xl font-bold text-warn mt-1">{stats.remaining}</p>
          </div>
          <div className="border border-line bg-raised p-3 shadow-xs">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Completion</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-display text-2xl font-bold text-accent">{stats.percentage}%</span>
              {stats.highRemaining > 0 && (
                <span className="text-[10px] font-semibold text-bad">
                  {stats.highRemaining} high priority pending
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal / Collapse Form */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="border border-accent/40 bg-raised p-5 shadow-xs space-y-3">
          <h3 className="font-display text-sm font-semibold text-ink">New Task for {formatDisplayDate(selectedDate)}</h3>
          
          <div>
            <label htmlFor="task-title" className="block text-xs font-semibold text-muted uppercase mb-1">
              Title *
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Finish Chapter 3 of Operating Systems"
              maxLength={200}
              required
              autoFocus
              className="w-full border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-accent"
            />
          </div>

          <div>
            <label htmlFor="task-desc" className="block text-xs font-semibold text-muted uppercase mb-1">
              Description (Optional)
            </label>
            <textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional notes, sub-steps, or links…"
              maxLength={1000}
              rows={2}
              className="w-full border border-line bg-paper px-3 py-2 text-xs text-ink placeholder:text-muted/60"
            />
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <span className="block text-xs font-semibold text-muted uppercase mb-1">Priority</span>
              <div className="flex items-center gap-1.5">
                {['low', 'medium', 'high'].map((p) => {
                  const cfg = PRIORITY_CONFIG[p]
                  const isSelected = priority === p
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`px-3 py-1 text-xs font-medium border rounded-xs transition-colors ${
                        isSelected
                          ? `${cfg.color} font-bold ring-1 ring-ink`
                          : 'border-line bg-paper text-muted hover:text-ink'
                      }`}
                    >
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label htmlFor="task-category" className="block text-xs font-semibold text-muted uppercase mb-1">
                Category
              </label>
              <select
                id="task-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border border-line bg-paper px-3 py-1 text-xs text-ink"
              >
                {TASK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="border border-line bg-paper px-3 py-1.5 text-xs text-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="bg-accent px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-accent-hover disabled:opacity-50"
            >
              {submitting ? 'Creating…' : 'Save Task'}
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      {tasks.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted mr-1">Filter:</span>
          {[
            { id: 'all', label: `All (${tasks.length})` },
            { id: 'pending', label: `Pending (${tasks.filter((t) => !t.completed).length})` },
            { id: 'completed', label: `Completed (${tasks.filter((t) => t.completed).length})` },
            { id: 'high', label: 'High Priority' },
            { id: 'medium', label: 'Medium' },
            { id: 'low', label: 'Low' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-xs transition-colors ${
                filter === item.id
                  ? 'bg-ink text-paper'
                  : 'border border-line bg-raised text-muted hover:text-ink'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Task List */}
      {loading ? (
        <div className="py-12 text-center text-muted">
          <div className="mx-auto h-6 w-6 animate-spin border-2 border-line border-t-accent rounded-full mb-3" />
          <p className="text-sm">Loading daily tasks for {selectedDate}…</p>
        </div>
      ) : error ? (
        <div className="border border-bad/30 bg-bad/10 p-4 text-xs text-bad">
          {error}
          <button
            type="button"
            onClick={() => loadTasks(selectedDate)}
            className="ml-3 underline font-semibold"
          >
            Retry
          </button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="border border-dashed border-line bg-raised/50 px-6 py-12 text-center shadow-xs">
          <p className="font-display text-lg font-semibold text-ink">No tasks planned for {formatDisplayDate(selectedDate)}</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-muted">
            Daily tasks are single-day objectives that keep your day organized. Unlike habits, they are tied to a specific calendar date and won&rsquo;t roll over automatically.
          </p>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="mt-4 bg-ink px-4 py-2 text-xs font-semibold text-paper shadow-xs hover:bg-ink/90"
          >
            + Add Task for {selectedDate}
          </button>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="border border-dashed border-line p-6 text-center text-xs text-muted">
          No tasks match the selected &ldquo;{filter}&rdquo; filter.
        </div>
      ) : (
        <div className="border border-line bg-raised shadow-xs">
          <ul className="divide-y divide-line">
            {filteredTasks.map((task) => {
              const isDone = task.completed
              const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium

              if (editingId === task._id) {
                return (
                  <li key={task._id} className="p-4 bg-paper/40 space-y-3">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full border border-accent bg-paper px-2 py-1 text-sm font-medium"
                      autoFocus
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Description…"
                      rows={2}
                      className="w-full border border-line bg-paper px-2 py-1 text-xs"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <select
                          value={editPriority}
                          onChange={(e) => setEditPriority(e.target.value)}
                          className="border border-line bg-paper px-2 py-1 text-xs"
                        >
                          <option value="low">Low Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="high">High Priority</option>
                        </select>
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="border border-line bg-paper px-2 py-1 text-xs"
                        >
                          {TASK_CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="border border-line bg-paper px-3 py-1 text-xs text-muted hover:text-ink"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(task._id)}
                          className="bg-accent px-3 py-1 text-xs font-semibold text-white hover:bg-accent-hover"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </li>
                )
              }

              return (
                <li
                  key={task._id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 transition-colors ${
                    isDone ? 'bg-paper/30' : 'hover:bg-paper/20'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={isDone}
                      onClick={() => handleToggle(task._id)}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border transition-all ${
                        isDone
                          ? 'border-good bg-good text-white'
                          : 'border-ink/50 bg-paper hover:border-ink'
                      }`}
                      aria-label={`Toggle task: ${task.title}`}
                    >
                      {isDone && (
                        <svg className="h-3.5 w-3.5 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          onClick={() => handleToggle(task._id)}
                          className={`cursor-pointer text-sm font-medium transition-colors select-none ${
                            isDone ? 'text-muted line-through opacity-70' : 'text-ink'
                          }`}
                        >
                          {task.title}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 border px-1.5 py-0.2 text-[10px] font-semibold uppercase tracking-wider rounded-xs ${priorityCfg.color}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${priorityCfg.dot}`} />
                          {priorityCfg.label}
                        </span>

                        {task.category && task.category !== 'General' && (
                          <span className="border border-line bg-paper-2/70 px-1.5 py-0.2 text-[10px] font-semibold text-muted uppercase tracking-wider">
                            {task.category}
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className={`mt-1 text-xs ${isDone ? 'text-muted/60 line-through' : 'text-muted'}`}>
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(task)}
                      className="text-xs text-muted hover:text-ink transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(task._id, task.title)}
                      className="text-xs text-muted hover:text-bad transition-colors"
                      aria-label={`Delete task: ${task.title}`}
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
    </section>
  )
}
