import { useState, useEffect } from 'react'
import { getFriendsList, sendSharedTask } from '../services/api'

export default function SendTaskModal({ onTaskSent, onClose }) {
  const [friends, setFriends] = useState([])
  const [selectedFriends, setSelectedFriends] = useState([])
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadFriends()
  }, [])

  const loadFriends = async () => {
    try {
      const data = await getFriendsList()
      setFriends(data.friends || [])
    } catch (err) {
      setError('Failed to load friends')
    }
  }

  const toggleFriend = (friendId) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      if (selectedFriends.length === 0) {
        setError('Select at least one friend')
        setLoading(false)
        return
      }

      if (!title.trim()) {
        setError('Enter a task title')
        setLoading(false)
        return
      }

      await sendSharedTask(selectedFriends, title)

      setSuccess(true)
      setTitle('')
      setSelectedFriends([])

      // Call callback to refresh
      if (onTaskSent) onTaskSent()

      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose()
        setSuccess(false)
      }, 2000)
    } catch (err) {
      setError(err.message || 'Failed to send task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
        <h2 className="text-2xl font-bold text-white mb-4">📤 Send Task to Friends</h2>

        {error && (
          <div className="bg-red-500 text-white p-3 rounded mb-4">{error}</div>
        )}

        {success && (
          <div className="bg-green-500 text-white p-3 rounded mb-4">
            ✅ Task sent to {selectedFriends.length} friend(s)!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Title */}
          <div>
            <label className="block text-gray-300 mb-2 font-semibold">Task Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Study 2 hours"
              className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={loading || success}
            />
          </div>

          {/* Friend Selection */}
          <div>
            <label className="block text-gray-300 mb-2 font-semibold">Select Friends</label>

            {friends.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-700 p-3 rounded border border-gray-600">
                {friends.map((friend) => (
                  <label
                    key={friend._id}
                    className="flex items-center gap-3 cursor-pointer hover:bg-gray-600 p-2 rounded transition"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFriends.includes(friend._id)}
                      onChange={() => toggleFriend(friend._id)}
                      disabled={loading || success}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <p className="text-white font-semibold">{friend.name}</p>
                      <p className="text-gray-400 text-sm">@{friend.username}</p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 bg-gray-700 p-3 rounded text-sm">
                No friends yet. Add friends in the Friends tab first!
              </p>
            )}

            {selectedFriends.length > 0 && (
              <p className="text-green-400 text-sm mt-2">
                ✅ {selectedFriends.length} friend{selectedFriends.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading || success || friends.length === 0}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded transition"
            >
              {loading ? 'Sending...' : 'Send Task'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 text-white font-bold py-2 px-4 rounded transition"
            >
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
