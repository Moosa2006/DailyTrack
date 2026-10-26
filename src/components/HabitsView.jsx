import { useMemo, useRef, useState } from 'react'
import { addDays, formatDisplayDate, isToday, localDateString, weekdayLabel } from '../utils/date'

const CATEGORIES = ['General', 'Health', 'Focus', 'Fitness', 'Learning', 'Routine']

const STARTER_HABITS = [
  { title: 'Drink 2L of water', category: 'Health' },
  { title: 'Read 20 pages', category: 'Learning' },
  { title: '30-minute workout or walk', category: 'Fitness' },
  { title: 'Deep focus work (60m)', category: 'Focus' },
  { title: 'Evening reflection & plan', category: 'Routine' },
]

export default function HabitsView({
  selectedDate,
  setSelectedDate,
  dailyTasks,
  completionPercentage,
  stats,
  syncStatus,
  dirty,
  logExists,
  adding,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onUpdateTask,
  onOpenShareModal,
  onOpenSendChallenge,
  onOpenAnalyticsModal,
}) {
  const [taskInput, setTaskInput] = useState('')
  const [taskCategory, setTaskCategory] = useState('General')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [editingId, setEditingId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingCategory, setEditingCategory] = useState('General')
  const dateInputRef = useRef(null)

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => addDays(selectedDate, index - 3))
  }, [selectedDate])

  const completedCount = useMemo(() => {
    return dailyTasks.filter((task) => task.completed).length
  }, [dailyTasks])

  const filteredHabits = useMemo(() => {
    if (categoryFilter === 'all') return dailyTasks
    return dailyTasks.filter((task) => (task.category || 'General') === categoryFilter)
  }, [dailyTasks, categoryFilter])

  const handleAdd = () => {
    const trimmed = taskInput.trim()
    if (!trimmed || adding) return
    onAddTask(trimmed, taskCategory)
    setTaskInput('')
  }

  const handleSaveEdit = (taskId) => {
    const title = editingTitle.trim()
    if (!title) {
      setEditingId(null)
      return
    }
    onUpdateTask(taskId, title, editingCategory)
    setEditingId(null)
  }

  return (
    <section className="space-y-6">
      {/* 4 Stat Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Today Completion Card */}
          <div className="border border-line bg-raised p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-muted uppercase">
                Habit Goal
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
            <p className="mt-2 text-[11px] text-muted">Weekly habit consistency</p>
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
              onClick={onOpenAnalyticsModal}
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
              Last 30 Days Habit Consistency
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
                  <span
                    className={`mt-1 h-1.5 w-1.5 rounded-full ${
                      dayPercent >= 70
                        ? 'bg-good'
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
              {logExists ? 'Recorded in habit history.' : 'No habit log recorded yet for this date.'}
            </p>
            {syncStatus === 'saving' && (
              <span className="text-xs text-muted flex items-center gap-1">
                <span className="inline-block h-2 w-2 animate-ping bg-accent rounded-full" />
                Saving…
              </span>
            )}
            {syncStatus === 'saved' && (
              <span className="text-xs text-good font-medium">✓ Synced</span>
            )}
            {dirty && syncStatus === 'idle' && (
              <span className="text-xs text-warn font-medium">• Unsaved changes</span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenShareModal}
            className="border border-line bg-raised px-3 py-1.5 text-xs font-medium text-ink hover:border-ink transition-colors flex items-center gap-1.5"
          >
            <span>📤</span> Share {completionPercentage}%
          </button>
          <button
            type="button"
            onClick={onOpenSendChallenge}
            className="border border-line bg-raised px-3 py-1.5 text-xs font-medium text-ink hover:border-ink transition-colors flex items-center gap-1.5"
          >
            <span>🤝</span> Send challenge
          </button>
        </div>
      </div>

      {/* Add Habit Form */}
      <div className="border border-line bg-raised p-4 shadow-xs">
        <label htmlFor="new-habit" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
          Add a recurring habit
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="new-habit"
            type="text"
            value={taskInput}
            onChange={(event) => setTaskInput(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleAdd()}
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
            onClick={handleAdd}
            disabled={adding || !taskInput.trim()}
            className="bg-accent px-5 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {adding ? 'Adding…' : 'Add Habit'}
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
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

      {/* Habits Checklist */}
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
                onClick={() => onAddTask(starter.title, starter.category)}
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
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={isDone}
                      onClick={() => onToggleTask(task.taskId)}
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

                    {editingId === task.taskId ? (
                      <div className="flex flex-1 items-center gap-2">
                        <input
                          value={editingTitle}
                          onChange={(event) => setEditingTitle(event.target.value)}
                          onBlur={() => handleSaveEdit(task.taskId)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') handleSaveEdit(task.taskId)
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
                          onClick={() => onToggleTask(task.taskId)}
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
                      onClick={() => onDeleteTask(task.taskId)}
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
    </section>
  )
}
