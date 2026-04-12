import express from 'express'
import {
  sendFriendRequest,
  respondToFriendRequest,
  getFriendsList,
  getPendingRequests,
  getSentRequests,
  removeFriend,
} from '../controllers/friendController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

// All routes require authentication
router.use(authMiddleware)

// Send friend request
router.post('/request', sendFriendRequest)

// Accept/Reject friend request
router.post('/respond/:id', respondToFriendRequest)

// Get friends list
router.get('/list', getFriendsList)

// Get pending requests (received)
router.get('/requests/pending', getPendingRequests)

// Get sent requests
router.get('/requests/sent', getSentRequests)

// Remove friend
router.delete('/:friendId', removeFriend)

export default router
