import Modal from './Modal'

export default function AnalyticsModal({ stats, habits, onClose }) {
  if (!stats) return null

  const history = stats.history || []
  const recordedDays = history.filter((h) => h.completionPercentage !== null)
  const qualifyingDays = recordedDays.filter((h) => (h.completionPercentage ?? 0) >= 70)
  const consistencyRate = Math.round(
    (qualifyingDays.length / Math.max(recordedDays.length, 1)) * 100
  )

  return (
    <Modal title="Habits & Streak Analytics" onClose={onClose}>
      <div className="space-y-6 text-ink">
        {/* Top metrics summary */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="border border-line bg-paper p-3 text-center">
            <span className="block text-xs uppercase tracking-wider text-muted">Current</span>
            <span className="font-display text-2xl font-bold text-accent">{stats.currentStreak} d</span>
            <span className="block text-[11px] text-muted">Active streak</span>
          </div>
          <div className="border border-line bg-paper p-3 text-center">
            <span className="block text-xs uppercase tracking-wider text-muted">Best</span>
            <span className="font-display text-2xl font-bold text-ink">{stats.longestStreak} d</span>
            <span className="block text-[11px] text-muted">All-time record</span>
          </div>
          <div className="border border-line bg-paper p-3 text-center">
            <span className="block text-xs uppercase tracking-wider text-muted">Consistency</span>
            <span className="font-display text-2xl font-bold text-good">{consistencyRate}%</span>
            <span className="block text-[11px] text-muted">Days &ge; 70%</span>
          </div>
          <div className="border border-line bg-paper p-3 text-center">
            <span className="block text-xs uppercase tracking-wider text-muted">Logs</span>
            <span className="font-display text-2xl font-bold text-ink">{stats.logsCount || recordedDays.length}</span>
            <span className="block text-[11px] text-muted">Days logged</span>
          </div>
        </div>

        {/* Consistency progress */}
        <div className="border border-line bg-paper p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-ink">30-Day Streak Qualification</span>
            <span className="font-semibold text-good">{qualifyingDays.length} of {recordedDays.length} logged days</span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-paper-2">
            <div
              className="h-full bg-good transition-all duration-500 rounded-full"
              style={{ width: `${consistencyRate}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted">
            Days with 70% or higher completion count towards maintaining your habit streak.
          </p>
        </div>

        {/* Active habits breakdown */}
        {habits && habits.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Current Habits List ({habits.length})
            </h3>
            <ul className="divide-y divide-line border border-line bg-paper">
              {habits.map((habit) => (
                <li key={habit.taskId || habit._id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="font-medium text-ink truncate">{habit.title}</span>
                  <span className="border border-line bg-raised px-2 py-0.5 text-xs text-muted">
                    {habit.category || 'General'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="border border-line bg-paper px-4 py-2 text-sm font-medium text-ink hover:border-ink transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
