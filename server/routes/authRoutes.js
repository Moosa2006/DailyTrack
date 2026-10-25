import express from 'express'
import { signup, login } from '../controllers/authController.js'
import { rateLimit } from '../middleware/rateLimit.js'

const router = express.Router()

router.post('/signup', rateLimit({ max: 8 }), signup)
router.post('/login', rateLimit({ max: 20 }), login)

export default router
