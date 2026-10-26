import { useEffect, useMemo, useState } from 'react'
import {
  getDailyTaskSummary,
  getDailyTaskHistory,
  getDailyNote,
  createDailyTask,
} from '../services/api'
import { useToast } from './Toast'
import { addDays, formatDisplayDate, isToday, localDateString, weekdayLabel } from '../utils/date'

export default function DailyAnalysisView({ initialDate }) {
  const [selectedDate, setSelectedDate] = useState(initialDate || localDateString())
  const [summary, setSummary] = useState(null)
  const [note, setNote] = useState('')
  const [weekHistory, setWeekHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [carryingId, setCarryingId] = useState(null)
  const toast = useToast()

  const todayStr = localDateString()

  const loadData = async (date) => {
    setLoading(true)
    try {
      const sevenDaysAgo = addDays(date, -6)
      const [sumData, noteData, historyData] = await Promise.all([
        getDailyTaskSummary(date),
        getDailyNote(date),
        getDailyTaskHistory(sevenDaysAgo, date),
      ])

      setSummary(sumData)
      setNote(noteData.content || '')
      setWeekHistory(historyData.history || [])
    } catch {
      toast('Failed to load task analysis', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(selectedDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => addDays(selectedDate, index - 6))
  }, [selectedDate])

  // Intentional carry-forward: creates a brand-new task for TODAY without altering history
  const handleCarryForward = async (task) => {
    setCarryingId(task.id)
    try {
      await createDailyTask({
        title: task.title,
        priority: task.priority || 'medium',
        date: todayStr,
      })
      toast(`Carried forward to today's tasks`, 'success')
      // Refresh current date analysis
      loadData(selectedDate)
    } catch {
      toast('Could not carry forward task', 'error')
    } finally {
      setCarryingId(null)
    }
  }

  // Progress ring math
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const completionPct = summary?.completionPercentage || 0
  const strokeDashoffset = circumference - (completionPct / 100) * circumference

  return (
    <section className="space-y-6">
      {/* Date Navigation & Calendar Strip */}
      <div className="border border-line bg-raised p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider text-muted uppercase">
              Analysis Date:
            </span>
            <span className="font-display text-base font-bold text-ink">
              {formatDisplayDate(selectedDate)}
            </span>
            {isToday(selectedDate) ? (
              <span className="border border-accent/40 bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                Today
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className="border border-line bg-paper px-2 py-0.5 text-xs font-medium text-accent hover:border-accent"
              >
                Jump to Today
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
              className="border border-line bg-paper px-2.5 py-1 text-xs font-medium text-ink hover:border-ink"
            >
              &lsaquo; Prev Day
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              className="border border-line bg-paper px-2.5 py-1 text-xs font-medium text-ink hover:border-ink"
            >
              Next Day &rsaquo;
            </button>
          </div>
        </div>

        {/* 7-Day Day Selector */}
        <div className="grid grid-cols-7 gap-1.5 pt-1 border-t border-line">
          {weekDays.map((date) => {
            const isDaySelected = date === selectedDate
            const dayStat = weekHistory.find((h) => h.date === date)
            const dayPct = dayStat?.completionPercentage

            return (
              <button
                key={date}
                type="button"
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xs transition-colors ${
                  isDaySelected
                    ? 'bg-ink text-paper shadow-xs font-semibold'
                    : isToday(date)
                      ? 'border border-accent bg-accent/5 text-ink'
                      : 'border border-transparent bg-paper/60 text-muted hover:border-line hover:text-ink'
                }`}
              >
                <span className="text-[10px] uppercase tracking-wider">{weekdayLabel(date)}</span>
                <span className="text-xs font-display font-medium mt-0.5">{date.slice(-2)}</span>
                <span
                  className={`mt-1 h-1.5 w-1.5 rounded-full ${
                    dayPct !== undefined
                      ? dayPct >= 70
                        ? 'bg-good'
                        : dayPct > 0
                          ? 'bg-warn'
                          : 'bg-paper-2 border border-line'
                      : 'bg-transparent'
                  }`}
                />
              </button>
            )
          })}
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-muted">
          <div className="mx-auto h-6 w-6 animate-spin border-2 border-line border-t-accent rounded-full mb-3" />
          <p className="text-sm">Calculating daily task analysis…</p>
        </div>
      ) : summary?.total === 0 ? (
        <div className="border border-dashed border-line bg-raised/50 p-10 text-center shadow-xs">
          <p className="font-display text-lg font-semibold text-ink">No task data for this date</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-muted">
            There were no daily tasks recorded for {formatDisplayDate(selectedDate)}. Add tasks in the Daily Tasks tab to inspect productivity and completion metrics.
          </p>
        </div>
      ) : (
        <>
          {/* Main Analytics Cards & Progress Ring */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* SVG Progress Ring Card */}
            <div className="border border-line bg-raised p-5 shadow-xs flex flex-col items-center justify-center text-center">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                Daily Task Completion
              </span>

              <div className="relative flex items-center justify-center">
                <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    className="stroke-paper-2"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    className="stroke-good transition-all duration-700 ease-out"
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                <div className="absolute flex flex-col items-center">
                  <span className="font-display text-3xl font-bold text-ink">
                    {summary.completionPercentage}%
                  </span>
                  <span className="text-[11px] text-muted">
                    {summary.completed} of {summary.total} Done
                  </span>
                </div>
              </div>

              <p className="mt-4 text-xs text-muted">
                {summary.remaining === 0
                  ? '🎉 All planned daily tasks achieved!'
                  : `${summary.remaining} task${summary.remaining === 1 ? '' : 's'} remaining`}
              </p>
            </div>

            {/* Priority Breakdown Card */}
            <div className="border border-line bg-raised p-5 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Priority Breakdown
                </span>
                <p className="text-xs text-muted mt-1">High-stakes vs routine task completion</p>

                <div className="mt-4 space-y-3">
                  {/* High Priority */}
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="flex items-center gap-1.5 text-bad">
                        <span className="h-2 w-2 rounded-full bg-bad" /> High Priority
                      </span>
                      <span>
                        {summary.priorityBreakdown.high.completed} / {summary.priorityBreakdown.high.total}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-paper-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-bad rounded-full"
                        style={{
                          width: `${
                            summary.priorityBreakdown.high.total > 0
                              ? (summary.priorityBreakdown.high.completed / summary.priorityBreakdown.high.total) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Medium Priority */}
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="flex items-center gap-1.5 text-warn">
                        <span className="h-2 w-2 rounded-full bg-warn" /> Medium Priority
                      </span>
                      <span>
                        {summary.priorityBreakdown.medium.completed} / {summary.priorityBreakdown.medium.total}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-paper-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-warn rounded-full"
                        style={{
                          width: `${
                            summary.priorityBreakdown.medium.total > 0
                              ? (summary.priorityBreakdown.medium.completed / summary.priorityBreakdown.medium.total) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Low Priority */}
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="flex items-center gap-1.5 text-muted">
                        <span className="h-2 w-2 rounded-full bg-muted" /> Low Priority
                      </span>
                      <span>
                        {summary.priorityBreakdown.low.completed} / {summary.priorityBreakdown.low.total}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-paper-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-ink rounded-full"
                        style={{
                          width: `${
                            summary.priorityBreakdown.low.total > 0
                              ? (summary.priorityBreakdown.low.completed / summary.priorityBreakdown.low.total) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-line pt-3 mt-3">
                <span className="text-[11px] text-muted">
                  Focus impact: {summary.priorityBreakdown.high.completed} high priority objectives finished.
                </span>
              </div>
            </div>

            {/* Factual Performance Summary Card */}
            <div className="border border-line bg-raised p-5 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Daily Execution Summary
                </span>
                <p className="text-xs text-muted mt-1">Objective metrics for this date</p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="border border-line bg-paper p-3">
                    <span className="text-[10px] text-muted uppercase font-semibold">Planned</span>
                    <p className="font-display text-xl font-bold text-ink mt-0.5">{summary.total}</p>
                  </div>
                  <div className="border border-line bg-paper p-3">
                    <span className="text-[10px] text-muted uppercase font-semibold">Completed</span>
                    <p className="font-display text-xl font-bold text-good mt-0.5">{summary.completed}</p>
                  </div>
                  <div className="border border-line bg-paper p-3">
                    <span className="text-[10px] text-muted uppercase font-semibold">Remaining</span>
                    <p className="font-display text-xl font-bold text-warn mt-0.5">{summary.remaining}</p>
                  </div>
                  <div className="border border-line bg-paper p-3">
                    <span className="text-[10px] text-muted uppercase font-semibold">Success Rate</span>
                    <p className="font-display text-xl font-bold text-accent mt-0.5">{summary.completionPercentage}%</p>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-[11px] text-muted border-t border-line pt-3">
                Independent of recurring habit streaks. Reflects single-day tasks only.
              </p>
            </div>
          </div>

          {/* Daily Reflection Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Completed vs Unfinished Tasks breakdown */}
            <div className="border border-line bg-raised p-5 shadow-xs space-y-4">
              <h3 className="font-display text-base font-semibold text-ink border-b border-line pb-2">
                Task Breakdown
              </h3>

              {/* Completed Tasks */}
              <div>
                <span className="text-xs font-semibold text-good uppercase tracking-wider">
                  ✓ Completed Objectives ({summary.reflection.completedTasks.length})
                </span>
                {summary.reflection.completedTasks.length === 0 ? (
                  <p className="text-xs text-muted mt-1 italic">No tasks completed yet on this date.</p>
                ) : (
                  <ul className="mt-2 divide-y divide-line/60">
                    {summary.reflection.completedTasks.map((t) => (
                      <li key={t.id} className="py-1.5 flex items-center justify-between text-xs">
                        <span className="text-ink font-medium">{t.title}</span>
                        <span className="text-[10px] uppercase font-semibold text-muted">{t.priority}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Unfinished Tasks */}
              <div className="border-t border-line pt-3">
                <span className="text-xs font-semibold text-warn uppercase tracking-wider">
                  • Unfinished Objectives ({summary.reflection.unfinishedTasks.length})
                </span>
                {summary.reflection.unfinishedTasks.length === 0 ? (
                  <p className="text-xs text-good mt-1 font-medium">All tasks finished!</p>
                ) : (
                  <ul className="mt-2 divide-y divide-line/60">
                    {summary.reflection.unfinishedTasks.map((t) => (
                      <li key={t.id} className="py-2 flex items-center justify-between text-xs gap-2">
                        <span className="text-muted">{t.title}</span>
                        {!isToday(selectedDate) && (
                          <button
                            type="button"
                            onClick={() => handleCarryForward(t)}
                            disabled={carryingId === t.id}
                            className="shrink-0 border border-line bg-paper px-2 py-0.5 text-[11px] font-semibold text-accent hover:border-accent"
                            title="Create a copy of this task in today's active task list"
                          >
                            {carryingId === t.id ? 'Carrying…' : '+ Carry to Today'}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Daily Note Preview for this date */}
            <div className="border border-line bg-raised p-5 shadow-xs space-y-3">
              <h3 className="font-display text-base font-semibold text-ink border-b border-line pb-2">
                Journal Reflection for {formatDisplayDate(selectedDate)}
              </h3>
              {note ? (
                <div className="bg-paper p-4 border border-line text-xs text-ink leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {note}
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-line text-xs text-muted">
                  No daily note recorded for this date.
                </div>
              )}
            </div>
          </div>

          {/* 7-Day Weekly Task Overview Bar Chart */}
          {weekHistory.length > 0 && (
            <div className="border border-line bg-raised p-5 shadow-xs">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                7-Day Task Execution History
              </h3>
              <p className="text-xs text-muted mb-4">
                Daily task completion percentage over the past 7 days.
              </p>

              <div className="flex items-end justify-between gap-2 h-36 pt-4 border-b border-line">
                {weekHistory.map((day) => {
                  const isCurrent = day.date === selectedDate
                  const heightPct = Math.max(day.completionPercentage, 4)

                  return (
                    <div
                      key={day.date}
                      className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                      onClick={() => setSelectedDate(day.date)}
                      title={`${day.date}: ${day.completed}/${day.total} tasks (${day.completionPercentage}%)`}
                    >
                      <span className="text-[10px] font-medium text-muted mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {day.completionPercentage}%
                      </span>
                      <div
                        className={`w-full max-w-[28px] rounded-t-xs transition-all ${
                          isCurrent
                            ? 'bg-ink'
                            : day.completionPercentage >= 70
                              ? 'bg-good/80 group-hover:bg-good'
                              : day.completionPercentage > 0
                                ? 'bg-warn/80 group-hover:bg-warn'
                                : 'bg-paper-2 border border-line'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="text-[10px] text-muted mt-2 uppercase">
                        {weekdayLabel(day.date)}
                      </span>
                      <span className="text-[9px] text-muted">{day.date.slice(-2)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
