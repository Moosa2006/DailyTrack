import { useState, useEffect } from 'react'
import {
  getFriendsList,
  getPendingRequests,
  getSentRequests,
  searchUsers,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
} from '../services/api'

export default function FriendsPanel() {
  const [tab, setTab] = useState('friends') // friends, requests, sent, add
  const [friends, setFriends] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [sentRequests, setSentRequests] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [respondingTo, setRespondingTo] = useState(null)
  const [message, setMessage] = useState('')

  // Load friends and requests
  const loadFriends = async () => {
    setLoading(true)
    try {
      const data = await getFriendsList()
      setFriends(data.friends || [])
    } catch (err) {
      console.error('Failed to load friends')
    }
    setLoading(false)
  }

  const loadRequests = async () => {
    setLoading(true)
    try {
      const data = await getPendingRequests()
      setPendingRequests(data.requests || [])
    } catch (err) {
      console.error('Failed to load requests')
    }
    setLoading(false)
  }

  const loadSentRequests = async () => {
    setLoading(true)
    try {
      const data = await getSentRequests()
      setSentRequests(data.requests || [])
    } catch (err) {
      console.error('Failed to load sent requests')
    }
    setLoading(false)
  }

  // Search users
  const handleSearch = async (query) => {
    setSearchQuery(query)
    if (query.trim().length < 2) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const data = await searchUsers(query)
      setSearchResults(data.results || [])
    } catch (err) {
      console.error('Search failed')
    }
    setLoading(false)
  }

  // Send friend request
  const handleSendRequest = async (username) => {
    try {
      const response = await sendFriendRequest(username)
      setMessage('✅ Friend request sent!')
      setSearchQuery('')
      setSearchResults([])
      await loadRequests()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage(err.message || '❌ Failed to send request')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  // Accept/Reject request
  const handleResponse = async (id, action) => {
    setRespondingTo(id)
    try {
      await respondToFriendRequest(id, action)
      await loadRequests()
      await loadFriends()
      setMessage(`✅ Request ${action}!`)
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('❌ Failed to respond')
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setRespondingTo(null)
    }
  }

  // Remove friend
  const handleRemoveFriend = async (friendId) => {
    if (!window.confirm('Remove this friend?')) return
    try {
      await removeFriend(friendId)
      await loadFriends()
      setMessage('✅ Friend removed')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('❌ Failed to remove friend')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  useEffect(() => {
    if (tab === 'friends') loadFriends()
    if (tab === 'requests') loadRequests()
    if (tab === 'sent') loadSentRequests()
  }, [tab])

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4">👥 Friends</h2>

      {message && <div className="bg-blue-600 text-white p-3 rounded mb-4">{message}</div>}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('friends')}
          className={`px-4 py-2 rounded font-semibold transition ${
            tab === 'friends'
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Friends ({friends.length})
        </button>
        <button
          onClick={() => setTab('requests')}
          className={`px-4 py-2 rounded font-semibold transition ${
            tab === 'requests'
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Requests ({pendingRequests.length})
        </button>
        <button
          onClick={() => setTab('sent')}
          className={`px-4 py-2 rounded font-semibold transition ${
            tab === 'sent'
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Sent ({sentRequests.length})
        </button>
        <button
          onClick={() => setTab('add')}
          className={`px-4 py-2 rounded font-semibold transition ${
            tab === 'add'
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Add Friend
        </button>
      </div>

      {/* Friends List */}
      {tab === 'friends' && (
        <div>
          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : friends.length > 0 ? (
            <div className="space-y-3">
              {friends.map((friend) => (
                <div
                  key={friend._id}
                  className="bg-gray-700 p-3 rounded flex justify-between items-center hover:bg-gray-600 transition"
                >
                  <div>
                    <p className="text-white font-semibold">{friend.name}</p>
                    <p className="text-gray-400 text-sm">@{friend.username}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveFriend(friend._id)}
                    className="text-red-400 hover:text-red-300 text-sm font-semibold"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No friends yet. Add some!</p>
          )}
        </div>
      )}

      {/* Pending Requests */}
      {tab === 'requests' && (
        <div>
          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : pendingRequests.length > 0 ? (
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div
                  key={request._id}
                  className="bg-gray-700 p-3 rounded flex justify-between items-center"
                >
                  <div className="flex-1">
                    <p className="text-white font-semibold">{request.senderId.name}</p>
                    <p className="text-gray-400 text-sm">@{request.senderId.username}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResponse(request._id, 'accepted')}
                      disabled={respondingTo === request._id}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm font-semibold transition"
                    >
                      ✅ Accept
                    </button>
                    <button
                      onClick={() => handleResponse(request._id, 'rejected')}
                      disabled={respondingTo === request._id}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm font-semibold transition"
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No pending requests</p>
          )}
        </div>
      )}

      {/* Sent Requests */}
      {tab === 'sent' && (
        <div>
          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : sentRequests.length > 0 ? (
            <div className="space-y-3">
              {sentRequests.map((request) => (
                <div
                  key={request._id}
                  className="bg-gray-700 p-3 rounded flex justify-between items-center"
                >
                  <div className="flex-1">
                    <p className="text-white font-semibold">{request.receiverId.name}</p>
                    <p className="text-gray-400 text-sm">@{request.receiverId.username}</p>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm font-semibold ${
                    request.status === 'pending' ? 'bg-yellow-600' :
                    request.status === 'accepted' ? 'bg-green-600' :
                    'bg-red-600'
                  } text-white`}>
                    {request.status === 'pending' ? '⏳ Pending' :
                     request.status === 'accepted' ? '✅ Accepted' :
                     '❌ Rejected'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No sent requests</p>
          )}
        </div>
      )}

      {/* Add Friends */}
      {tab === 'add' && (
        <div>
          <input
            type="text"
            placeholder="Search by username..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"
          />

          {loading ? (
            <p className="text-gray-400">Searching...</p>
          ) : searchResults.length > 0 ? (
            <div className="space-y-3">
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  className="bg-gray-700 p-3 rounded flex justify-between items-center hover:bg-gray-600 transition"
                >
                  <div>
                    <p className="text-white font-semibold">{user.name}</p>
                    <p className="text-gray-400 text-sm">@{user.username}</p>
                  </div>
                  <button
                    onClick={() => handleSendRequest(user.username)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded font-semibold transition"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <p className="text-gray-400">No users found</p>
          ) : (
            <p className="text-gray-400">Start typing to search</p>
          )}
        </div>
      )}
    </div>
  )
}
