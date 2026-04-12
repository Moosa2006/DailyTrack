import DailyLog from '../models/DailyLog.js'
import Task from '../models/Task.js'
import SharedTask from '../models/SharedTask.js'

// Save or update daily log
export const saveLog = async (req, res) => {
  try {
    const { date, tasks, notes } = req.body
    const userId = req.user.id

    // Validate date
    if (!date) {
      return res.status(400).json({ message: 'Date is required' })
    }

    const logDate = new Date(date)
    logDate.setHours(0, 0, 0, 0)

    // Calculate completion percentage
    const completedCount = tasks.filter(t => t.completed).length
    const completionPercentage = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

    // Find existing log or create new one
    let log = await DailyLog.findOne({
      userId,
      date: logDate,
    })

    // Update SharedTasks completion if needed
    for (const task of tasks) {
      if (task.completed && task.taskId) {
        const sharedTask = await SharedTask.findOne({
          taskId: task.taskId,
          receiverId: userId,
          status: 'accepted',
        })

        if (sharedTask) {
          sharedTask.completed = true
          sharedTask.completedAt = new Date()
          await sharedTask.save()
        }
      }
    }

    if (log) {
      log.tasks = tasks
      log.notes = notes || ''
      log.completionPercentage = completionPercentage
    } else {
      log = new DailyLog({
        userId,
        date: logDate,
        tasks,
        notes: notes || '',
        completionPercentage,
      })
    }

    await log.save()
    res.json(log)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Get log for specific date
export const getLog = async (req, res) => {
  try {
    const { date } = req.params
    const userId = req.user.id

    const logDate = new Date(date)
    logDate.setHours(0, 0, 0, 0)

    const log = await DailyLog.findOne({
      userId,
      date: logDate,
    }).populate('tasks.taskId')

    if (!log) {
      // Return empty log if not found
      const tasks = await Task.find({ userId })
      return res.json({
        userId,
        date: logDate,
        tasks: tasks.map(t => ({ taskId: t._id, completed: false })),
        notes: '',
        completionPercentage: 0,
      })
    }

    res.json(log)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}
