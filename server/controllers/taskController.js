import Task from '../models/Task.js'

// Get all tasks for user
export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id })
    res.json(tasks)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Create task
export const createTask = async (req, res) => {
  try {
    const { title } = req.body

    if (!title) {
      return res.status(400).json({ message: 'Title is required' })
    }

    const task = new Task({
      userId: req.user.id,
      title,
    })

    await task.save()
    res.status(201).json(task)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Update task
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params
    const { title } = req.body

    const task = await Task.findById(id)
    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    if (task.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    if (title) task.title = title
    await task.save()

    res.json(task)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Delete task
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
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}
