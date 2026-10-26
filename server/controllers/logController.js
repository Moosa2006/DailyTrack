import DailyLog from '../models/DailyLog.js'
import Task from '../models/Task.js'
import SharedTask from '../models/SharedTask.js'
import { parseDateOnly } from '../utils/date.js'

export const saveLog = async (req, res) => {
  try {
    const { date, tasks, notes } = req.body
    const userId = req.user.id

    const logDate = parseDateOnly(date)
    if (!logDate) {
      return res.status(400).json({ message: 'A valid date (YYYY-MM-DD) is required' })
    }

    if (!Array.isArray(tasks)) {
      return res.status(400).json({ message: 'Tasks must be an array' })
    }

    const completedCount = tasks.filter((task) => task.completed).length
    const completionPercentage =
      tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

    const sanitizedNotes = String(notes || '').slice(0, 2000)
    const sanitizedTasks = tasks
      .filter((task) => task.taskId)
      .map((task) => ({
        taskId: task.taskId,
        title: String(task.title || '').trim(),
        completed: Boolean(task.completed),
      }))

    if (sanitizedTasks.length > 0) {
      const taskIds = sanitizedTasks.map((t) => t.taskId)
      const matchingShared = await SharedTask.find({
        taskId: { $in: taskIds },
        receiverId: userId,
        status: 'accepted',
      })

      if (matchingShared.length > 0) {
        const completedMap = new Map(sanitizedTasks.map((t) => [String(t.taskId), t.completed]))
        await Promise.all(
          matchingShared.map((st) => {
            const isCompleted = completedMap.get(String(st.taskId)) ?? st.completed
            st.completed = isCompleted
            st.completedAt = isCompleted ? new Date() : null
            return st.save()
          })
        )
      }
    }

    const log = await DailyLog.findOneAndUpdate(
      { userId, date: logDate },
      {
        userId,
        date: logDate,
        tasks: sanitizedTasks,
        notes: sanitizedNotes,
        completionPercentage,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    )

    res.json(log)
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
}

export const getLog = async (req, res) => {
  try {
    const logDate = parseDateOnly(req.params.date)
    const userId = req.user.id

    if (!logDate) {
      return res.status(400).json({ message: 'A valid date (YYYY-MM-DD) is required' })
    }

    const log = await DailyLog.findOne({
      userId,
      date: logDate,
    }).populate('tasks.taskId', 'title')

    if (!log) {
      const tasks = await Task.find({ userId }).sort({ createdAt: 1 })
      return res.json({
        userId,
        date: req.params.date,
        exists: false,
        tasks: tasks.map((task) => ({
          taskId: { _id: task._id, title: task.title },
          completed: false,
        })),
        notes: '',
        completionPercentage: 0,
      })
    }

    const logObj = log.toObject()
    const mappedTasks = (logObj.tasks || []).map((item) => ({
      taskId: item.taskId?._id || item.taskId,
      title: item.taskId?.title || item.title || 'Habit',
      completed: Boolean(item.completed),
    }))

    res.json({ ...logObj, exists: true, date: req.params.date, tasks: mappedTasks })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
}
