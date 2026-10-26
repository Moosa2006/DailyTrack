import express from 'express'
import {
  createDailyTask,
  getDailyTasks,
  getDailyTaskSummary,
  getDailyTaskHistory,
  updateDailyTask,
  toggleDailyTask,
  deleteDailyTask,
} from '../controllers/dailyTaskController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(authMiddleware)

router.post('/', createDailyTask)
router.get('/', getDailyTasks)
router.get('/summary', getDailyTaskSummary)
router.get('/history', getDailyTaskHistory)
router.put('/:id', updateDailyTask)
router.patch('/:id/toggle', toggleDailyTask)
router.delete('/:id', deleteDailyTask)

export default router
