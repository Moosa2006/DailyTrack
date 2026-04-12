import express from 'express'
import { saveLog, getLog } from '../controllers/logController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(authMiddleware)

router.post('/', saveLog)
router.get('/:date', getLog)

export default router
