import express from 'express'
import {
  sendTask,
  getIncomingTasks,
  getSentTasks,
  respondToTask,
  getAllSharedTasks,
  getTaskProgress,
} from '../controllers/sharedTaskController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

// All routes protected with auth
router.use(authMiddleware)

// Send a task to one or multiple friends
router.post('/send', sendTask)

// Get incoming (pending) tasks
router.get('/incoming', getIncomingTasks)

// Get tasks sent by user
router.get('/sent', getSentTasks)

// Get task progress (sender tracking receivers)
router.get('/progress', getTaskProgress)

// Get all shared tasks (sent and received)
router.get('/all', getAllSharedTasks)

// Respond to a shared task (accept/reject)
router.post('/respond/:id', respondToTask)

export default router
