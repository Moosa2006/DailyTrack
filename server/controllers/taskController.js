import Task from '../models/Task.js'

export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: 1 })
    res.json(tasks)
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
}

export const createTask = async (req, res) => {
  try {
    const title = String(req.body.title || '').trim()
    const category = String(req.body.category || 'General').trim().slice(0, 30) || 'General'

    if (!title) {
      return res.status(400).json({ message: 'Title is required' })
    }

    if (title.length > 200) {
      return res.status(400).json({ message: 'Title must be 200 characters or fewer' })
    }

    const task = new Task({
      userId: req.user.id,
      title,
      category,
    })

    await task.save()
    res.status(201).json(task)
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
}

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params
    const title = String(req.body.title || '').trim()

    if (!title) {
      return res.status(400).json({ message: 'Title is required' })
    }

    if (title.length > 200) {
      return res.status(400).json({ message: 'Title must be 200 characters or fewer' })
    }

    const task = await Task.findById(id)
    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    if (task.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    task.title = title
    if (req.body.category !== undefined) {
      task.category = String(req.body.category || 'General').trim().slice(0, 30) || 'General'
    }
    await task.save()

    res.json(task)
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
}

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params

    const task = await Task.findById(id)
    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    if (task.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    await Task.deleteOne({ _id: id })
    res.json({ message: 'Task deleted' })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
}
