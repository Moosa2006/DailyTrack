import express from 'express'
import { getDailyNote, saveDailyNote } from '../controllers/dailyNoteController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(authMiddleware)

router.get('/:date', getDailyNote)
router.put('/:date', saveDailyNote)

export default router
