import SharedTask from '../models/SharedTask.js'
import User from '../models/User.js'
import Task from '../models/Task.js'

export const sendTask = async (req, res) => {
  try {
    const { receiverIds, title } = req.body
    const senderId = req.user.id
    const trimmedTitle = String(title || '').trim()

    if (
      !trimmedTitle ||
      !receiverIds ||
      !Array.isArray(receiverIds) ||
      receiverIds.length === 0
    ) {
      return res.status(400).json({ message: 'Title and at least one friend are required' })
    }

    if (trimmedTitle.length > 200) {
      return res.status(400).json({ message: 'Title must be 200 characters or fewer' })
    }

    const uniqueReceiverIds = [...new Set(receiverIds.map((id) => String(id)))]

    const sender = await User.findById(senderId)
    if (!sender) {
      return res.status(404).json({ message: 'User not found' })
    }

    const senderFriendIds = sender.friends.map((friend) => friend.toString())
    const invalidReceivers = uniqueReceiverIds.filter((id) => !senderFriendIds.includes(id))

    if (invalidReceivers.length > 0) {
      return res.status(400).json({ message: 'You can only send tasks to friends' })
    }

    const createdTasks = []
    for (const receiverId of uniqueReceiverIds) {
      const existing = await SharedTask.findOne({
        senderId,
        receiverId,
        title: trimmedTitle,
        status: 'pending',
      })

      if (!existing) {
        const sharedTask = new SharedTask({
          senderId,
          receiverId,
          title: trimmedTitle,
        })
        await sharedTask.save()
        createdTasks.push(sharedTask)
      }
    }

    if (createdTasks.length === 0) {
      return res.status(400).json({ message: 'This task was already sent to the selected friends' })
    }

    res.status(201).json({
      message: `Task sent to ${createdTasks.length} friend${createdTasks.length === 1 ? '' : 's'}`,
      tasks: createdTasks,
    })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
}

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
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
}

export const getSentTasks = async (req, res) => {
  try {
    const userId = req.user.id

    const tasks = await SharedTask.find({
      senderId: userId,
    })
      .populate('receiverId', 'name username')
      .sort({ createdAt: -1 })
      .limit(100)

    res.json({ tasks })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
}

export const respondToTask = async (req, res) => {
  try {
    const { id } = req.params
    const { action } = req.body
    const userId = req.user.id

    if (!['accepted', 'rejected'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' })
    }

    const sharedTask = await SharedTask.findById(id)
    if (!sharedTask) {
      return res.status(404).json({ message: 'Task not found' })
    }

    if (sharedTask.receiverId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    if (sharedTask.status !== 'pending') {
      return res.status(400).json({ message: 'You have already responded to this task' })
    }

    sharedTask.status = action
    if (action === 'accepted') {
      sharedTask.acceptedAt = new Date()

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
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
}

export const getAllSharedTasks = async (req, res) => {
  try {
    const userId = req.user.id

    const incomingTasks = await SharedTask.find({
      receiverId: userId,
    })
      .populate('senderId', 'name username')
      .sort({ createdAt: -1 })
      .limit(100)

    const sentTasks = await SharedTask.find({
      senderId: userId,
    })
      .populate('receiverId', 'name username')
      .sort({ createdAt: -1 })
      .limit(100)

    res.json({
      incoming: incomingTasks,
      sent: sentTasks,
    })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
}

export const getTaskProgress = async (req, res) => {
  try {
    const userId = req.user.id

    const sentTasks = await SharedTask.find({
      senderId: userId,
      status: 'accepted',
    })
      .populate('receiverId', 'name username')
      .sort({ createdAt: -1 })

    const progressByTitle = {}
    sentTasks.forEach((task) => {
      if (!task.receiverId) return
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
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
}
