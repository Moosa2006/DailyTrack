import express from 'express'
import { searchUsers, getUserProfile, getCurrentUserProfile } from '../controllers/userController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

// All routes require authentication
router.use(authMiddleware)

// Search users by username
router.get('/search', searchUsers)

// Get current user profile
router.get('/profile/me', getCurrentUserProfile)

// Get user profile by username
router.get('/profile/:username', getUserProfile)

export default router
