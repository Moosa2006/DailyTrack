import DailyTask from '../models/DailyTask.js'
import { isDateOnly, formatDateOnly } from '../utils/date.js'

function getPriorityWeight(priority) {
  if (priority === 'high') return 3
  if (priority === 'medium') return 2
  return 1
}

export const createDailyTask = async (req, res) => {
  try {
    const userId = req.user.id
    const title = String(req.body.title || '').trim()
    const description = String(req.body.description || '').trim()
    const category = String(req.body.category || 'General').trim().slice(0, 50) || 'General'
    const priority = ['low', 'medium', 'high'].includes(req.body.priority)
      ? req.body.priority
      : 'medium'

    // Scheduled date defaults to today if not provided or invalid
    let date = req.body.date
    if (!isDateOnly(date)) {
      date = formatDateOnly(new Date())
    }

    if (!title) {
      return res.status(400).json({ message: 'Task title is required' })
    }

    if (title.length > 200) {
      return res.status(400).json({ message: 'Task title must be 200 characters or fewer' })
    }

    if (description.length > 1000) {
      return res.status(400).json({ message: 'Description must be 1000 characters or fewer' })
    }

    const task = new DailyTask({
      userId,
      title,
      description,
      date,
      priority,
      category,
      completed: false,
    })

    await task.save()
    res.status(201).json(task)
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' })
  }
}

export const getDailyTasks = async (req, res) => {
  try {
    const userId = req.user.id
    let date = req.query.date
    if (!isDateOnly(date)) {
      date = formatDateOnly(new Date())
    }

    // Fetch tasks specifically for this user and date
    const tasks = await DailyTask.find({ userId, date }).lean()

    // Sort by priority (high > medium > low), then completion status (incomplete first), then createdAt
    tasks.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
      }
      const weightDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority)
      if (weightDiff !== 0) return weightDiff
      return new Date(a.createdAt) - new Date(b.createdAt)
    })

    res.json({ date, tasks })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' })
  }
}

export const getDailyTaskSummary = async (req, res) => {
  try {
    const userId = req.user.id
    let date = req.query.date
    if (!isDateOnly(date)) {
      date = formatDateOnly(new Date())
    }

    const tasks = await DailyTask.find({ userId, date }).lean()

    const total = tasks.length
    const completed = tasks.filter((t) => t.completed).length
    const remaining = total - completed
    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0

    const priorityBreakdown = {
      high: { total: 0, completed: 0, remaining: 0 },
      medium: { total: 0, completed: 0, remaining: 0 },
      low: { total: 0, completed: 0, remaining: 0 },
    }

    const categoryMap = {}

    tasks.forEach((task) => {
      const p = task.priority || 'medium'
      if (priorityBreakdown[p]) {
        priorityBreakdown[p].total += 1
        if (task.completed) {
          priorityBreakdown[p].completed += 1
        } else {
          priorityBreakdown[p].remaining += 1
        }
      }

      const cat = task.category || 'General'
      if (!categoryMap[cat]) {
        categoryMap[cat] = { total: 0, completed: 0 }
      }
      categoryMap[cat].total += 1
      if (task.completed) categoryMap[cat].completed += 1
    })

    const completedTasks = tasks.filter((t) => t.completed).map((t) => ({ id: t._id, title: t.title, priority: t.priority }))
    const unfinishedTasks = tasks.filter((t) => !t.completed).map((t) => ({ id: t._id, title: t.title, priority: t.priority }))

    res.json({
      date,
      total,
      completed,
      remaining,
      completionPercentage,
      priorityBreakdown,
      categories: categoryMap,
      reflection: {
        completedTasks,
        unfinishedTasks,
        highPriorityRemaining: priorityBreakdown.high.remaining,
        highPriorityCompleted: priorityBreakdown.high.completed,
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' })
  }
}

export const getDailyTaskHistory = async (req, res) => {
  try {
    const userId = req.user.id
    const { startDate, endDate } = req.query

    if (!isDateOnly(startDate) || !isDateOnly(endDate)) {
      return res.status(400).json({ message: 'Valid startDate and endDate (YYYY-MM-DD) are required' })
    }

    const tasks = await DailyTask.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    })
      .select('date completed priority')
      .lean()

    const summaryByDate = {}
    tasks.forEach((t) => {
      if (!summaryByDate[t.date]) {
        summaryByDate[t.date] = { date: t.date, total: 0, completed: 0, highPriorityTotal: 0, highPriorityCompleted: 0 }
      }
      summaryByDate[t.date].total += 1
      if (t.completed) summaryByDate[t.date].completed += 1
      if (t.priority === 'high') {
        summaryByDate[t.date].highPriorityTotal += 1
        if (t.completed) summaryByDate[t.date].highPriorityCompleted += 1
      }
    })

    const results = Object.values(summaryByDate).map((day) => ({
      ...day,
      remaining: day.total - day.completed,
      completionPercentage: day.total > 0 ? Math.round((day.completed / day.total) * 100) : 0,
    }))

    results.sort((a, b) => a.date.localeCompare(b.date))

    res.json({ history: results })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' })
  }
}

export const updateDailyTask = async (req, res) => {
  try {
    const { id } = req.params
    const task = await DailyTask.findById(id)

    if (!task) {
      return res.status(404).json({ message: 'Daily task not found' })
    }

    if (task.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    if (req.body.title !== undefined) {
      const title = String(req.body.title).trim()
      if (!title) {
        return res.status(400).json({ message: 'Task title cannot be empty' })
      }
      if (title.length > 200) {
        return res.status(400).json({ message: 'Task title must be 200 characters or fewer' })
      }
      task.title = title
    }

    if (req.body.description !== undefined) {
      task.description = String(req.body.description).trim().slice(0, 1000)
    }

    if (req.body.priority !== undefined) {
      if (['low', 'medium', 'high'].includes(req.body.priority)) {
        task.priority = req.body.priority
      }
    }

    if (req.body.category !== undefined) {
      task.category = String(req.body.category).trim().slice(0, 50) || 'General'
    }

    if (req.body.date !== undefined && isDateOnly(req.body.date)) {
      task.date = req.body.date
    }

    if (req.body.completed !== undefined) {
      task.completed = Boolean(req.body.completed)
      task.completedAt = task.completed ? new Date() : null
    }

    await task.save()
    res.json(task)
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' })
  }
}

export const toggleDailyTask = async (req, res) => {
  try {
    const { id } = req.params
    const task = await DailyTask.findById(id)

    if (!task) {
      return res.status(404).json({ message: 'Daily task not found' })
    }

    if (task.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    task.completed = !task.completed
    task.completedAt = task.completed ? new Date() : null

    await task.save()
    res.json(task)
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' })
  }
}

export const deleteDailyTask = async (req, res) => {
  try {
    const { id } = req.params
    const task = await DailyTask.findById(id)

    if (!task) {
      return res.status(404).json({ message: 'Daily task not found' })
    }

    if (task.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    await DailyTask.deleteOne({ _id: id })
    res.json({ message: 'Daily task deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' })
  }
}
