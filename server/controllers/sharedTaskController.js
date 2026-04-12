import SharedTask from '../models/SharedTask.js'
import User from '../models/User.js'
import Task from '../models/Task.js'

// Send task to one or multiple friends
export const sendTask = async (req, res) => {
  try {
    const { receiverIds, title } = req.body
    const senderId = req.user.id

    // Validate inputs
    if (!title || !receiverIds || !Array.isArray(receiverIds) || receiverIds.length === 0) {
      return res.status(400).json({ message: 'Title and receiver IDs are required' })
    }

    // Get sender with friends list
    const sender = await User.findById(senderId)
    if (!sender) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Validate all receivers are friends
    const senderFriendIds = sender.friends.map((f) => f.toString())
    const invalidReceivers = receiverIds.filter((id) => !senderFriendIds.includes(id.toString()))

    if (invalidReceivers.length > 0) {
      return res.status(400).json({ message: 'Can only send tasks to friends' })
    }

    // Prevent duplicates and create shared tasks
    const createdTasks = []
    for (const receiverId of receiverIds) {
      // Check for existing pending task to same receiver with same title
      const existing = await SharedTask.findOne({
        senderId,
        receiverId,
        title,
        status: 'pending',
      })

      if (!existing) {
        const sharedTask = new SharedTask({
          senderId,
          receiverId,
          title,
        })
        await sharedTask.save()
        createdTasks.push(sharedTask)
      }
    }

    if (createdTasks.length === 0) {
      return res.status(400).json({ message: 'Task already sent to selected users' })
    }

    res.status(201).json({
      message: `Task sent to ${createdTasks.length} friend(s)`,
      tasks: createdTasks,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Get incoming tasks (pending requests)
export const getIncomingTasks = async (req, res) => {
  try {
    const userId = req.user.id

    const tasks = await SharedTask.find({
      receiverId: userId,
      status: 'pending',
    })
      .populate('senderId', 'name username')
      .sort({ createdAt: -1 })

    res.json({ tasks })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Get sent tasks (sender's perspective)
export const getSentTasks = async (req, res) => {
  try {
    const userId = req.user.id

    const tasks = await SharedTask.find({
      senderId: userId,
    })
      .populate('receiverId', 'name username')
      .sort({ createdAt: -1 })

    res.json({ tasks })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Respond to task (accept/reject)
export const respondToTask = async (req, res) => {
  try {
    const { id } = req.params
    const { action } = req.body
    const userId = req.user.id

    // Validate action
    if (!['accepted', 'rejected'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' })
    }

    // Find shared task
    const sharedTask = await SharedTask.findById(id)
    if (!sharedTask) {
      return res.status(404).json({ message: 'Task not found' })
    }

    // Verify receiver
    if (sharedTask.receiverId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    // Prevent double action
    if (sharedTask.status !== 'pending') {
      return res.status(400).json({ message: 'Already responded to this task' })
    }

    // Update status
    sharedTask.status = action
    if (action === 'accepted') {
      sharedTask.acceptedAt = new Date()

      // Create corresponding task in Task collection
      const task = new Task({
        userId,
        title: sharedTask.title,
      })
      await task.save()
      sharedTask.taskId = task._id
    }

    await sharedTask.save()

    res.json({
      message: `Task ${action}`,
      sharedTask,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Get all shared tasks (for utility/admin views)
export const getAllSharedTasks = async (req, res) => {
  try {
    const userId = req.user.id

    const incomingTasks = await SharedTask.find({
      receiverId: userId,
    })
      .populate('senderId', 'name username')
      .sort({ createdAt: -1 })

    const sentTasks = await SharedTask.find({
      senderId: userId,
    })
      .populate('receiverId', 'name username')
      .sort({ createdAt: -1 })

    res.json({
      incoming: incomingTasks,
      sent: sentTasks,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Get progress (sender tracking all receivers' completion)
export const getTaskProgress = async (req, res) => {
  try {
    const userId = req.user.id

    // Get all tasks sent by this user
    const sentTasks = await SharedTask.find({
      senderId: userId,
      status: 'accepted', // Only show accepted tasks
    })
      .populate('receiverId', 'name username')
      .sort({ createdAt: -1 })

    // Group by title to show overall progress
    const progressByTitle = {}
    sentTasks.forEach((task) => {
      if (!progressByTitle[task.title]) {
        progressByTitle[task.title] = {
          title: task.title,
          receivers: [],
        }
      }
      progressByTitle[task.title].receivers.push({
        receiverId: task.receiverId._id,
        receiverName: task.receiverId.name,
        receiverUsername: task.receiverId.username,
        status: task.completed ? 'completed' : 'not-completed',
        completedAt: task.completedAt,
      })
    })

    res.json({
      progress: Object.values(progressByTitle),
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}
