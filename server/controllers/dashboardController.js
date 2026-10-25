import DailyLog from '../models/DailyLog.js'
import { addUtcDays, formatDateOnly, parseDateOnly } from '../utils/date.js'

const percentForDate = (byDate, date) => byDate.get(formatDateOnly(date)) ?? null

export const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id
    const today = parseDateOnly(req.query.date) || parseDateOnly(formatDateOnly(new Date()))

    const todayLog = await DailyLog.findOne({
      userId,
      date: today,
    })
    const todayCompletion = todayLog?.completionPercentage || 0

    const thirtyDaysAgo = addUtcDays(today, -29)

    const logs = await DailyLog.find({
      userId,
      date: { $gte: thirtyDaysAgo, $lte: today },
    }).sort({ date: 1 })

    const byDate = new Map(
      logs.map((log) => [formatDateOnly(log.date), log.completionPercentage])
    )

    const weekLogs = []
    for (let offset = 0; offset < 7; offset += 1) {
      const day = addUtcDays(today, -offset)
      const value = percentForDate(byDate, day)
      if (value !== null) weekLogs.push(value)
    }
    const weeklyAverage =
      weekLogs.length > 0
        ? Math.round(weekLogs.reduce((sum, value) => sum + value, 0) / weekLogs.length)
        : 0

    const monthlyValues = logs.map((log) => log.completionPercentage)
    const monthlyAverage =
      monthlyValues.length > 0
        ? Math.round(monthlyValues.reduce((sum, value) => sum + value, 0) / monthlyValues.length)
        : 0

    let currentStreak = 0
    let cursor = today
    if ((percentForDate(byDate, cursor) ?? 0) < 70) {
      cursor = addUtcDays(cursor, -1)
    }
    while ((percentForDate(byDate, cursor) ?? 0) >= 70) {
      currentStreak += 1
      cursor = addUtcDays(cursor, -1)
    }

    const totalLogsCount = await DailyLog.countDocuments({ userId })

    const qualifyingLogs = await DailyLog.find({
      userId,
      date: { $lte: today },
      completionPercentage: { $gte: 70 },
    })
      .select('date')
      .sort({ date: 1 })

    let longestStreak = 0
    let tempStreak = 0
    let prevDate = null

    for (const qLog of qualifyingLogs) {
      if (!prevDate) {
        tempStreak = 1
      } else {
        const diffMs = qLog.date.getTime() - prevDate.getTime()
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
        if (diffDays === 1) {
          tempStreak += 1
        } else if (diffDays > 1) {
          tempStreak = 1
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak)
      prevDate = qLog.date
    }
    longestStreak = Math.max(longestStreak, currentStreak)

    const history = []
    for (let offset = 29; offset >= 0; offset -= 1) {
      const day = addUtcDays(today, -offset)
      const date = formatDateOnly(day)
      history.push({
        date,
        completionPercentage: percentForDate(byDate, day),
      })
    }

    res.json({
      todayCompletion,
      weeklyAverage,
      monthlyAverage,
      currentStreak,
      longestStreak,
      logsCount: totalLogsCount,
      history,
    })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
}
