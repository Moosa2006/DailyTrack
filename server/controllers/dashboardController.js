import DailyLog from '../models/DailyLog.js'

// Dashboard stats
export const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get today's log
    const todayLog = await DailyLog.findOne({
      userId,
      date: today,
    })
    const todayCompletion = todayLog?.completionPercentage || 0

    // Get last 30 days
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)

    const logs = await DailyLog.find({
      userId,
      date: { $gte: thirtyDaysAgo, $lte: today },
    }).sort({ date: 1 })

    // Calculate weekly average (last 7 days)
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    const weekLogs = logs.filter(log => log.date >= sevenDaysAgo)
    const weeklyAverage = weekLogs.length > 0
      ? Math.round(weekLogs.reduce((sum, log) => sum + log.completionPercentage, 0) / weekLogs.length)
      : 0

    // Calculate monthly average (last 30 days)
    const monthlyAverage = logs.length > 0
      ? Math.round(logs.reduce((sum, log) => sum + log.completionPercentage, 0) / logs.length)
      : 0

    // Calculate streaks
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    for (let i = logs.length - 1; i >= 0; i--) {
      if (logs[i].completionPercentage >= 70) {
        tempStreak++
        if (i === logs.length - 1) currentStreak = tempStreak
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 0
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak)

    res.json({
      todayCompletion,
      weeklyAverage,
      monthlyAverage,
      currentStreak,
      longestStreak,
      logsCount: logs.length,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}
