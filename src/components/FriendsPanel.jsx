import { useEffect, useState } from 'react'
import {
  getFriendsList,
  getPendingRequests,
  getSentRequests,
  searchUsers,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
  cancelFriendRequest,
} from '../services/api'
import { useToast } from './Toast'

export default function FriendsPanel({ onCountsChange, onSendTask }) {
  const [tab, setTab] = useState('friends')
  const [friends, setFriends] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [sentRequests, setSentRequests] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [respondingTo, setRespondingTo] = useState(null)
  const toast = useToast()

  const loadFriends = async () => {
    setLoading(true)
    try {
      const data = await getFriendsList()
      setFriends(data.friends || [])
    } catch {
      toast('Could not load friends', 'error')
    }
    setLoading(false)
  }

  const loadRequests = async () => {
    setLoading(true)
    try {
      const data = await getPendingRequests()
      const requests = data.requests || []
      setPendingRequests(requests)
      onCountsChange?.(requests.length)
    } catch {
      toast('Could not load requests', 'error')
    }
    setLoading(false)
  }

  const loadSentRequests = async () => {
    setLoading(true)
    try {
      const data = await getSentRequests()
      setSentRequests(data.requests || [])
    } catch {
      toast('Could not load sent requests', 'error')
    }
    setLoading(false)
  }

  useEffect(() => {
    if (tab === 'friends') loadFriends()
    if (tab === 'requests') loadRequests()
    if (tab === 'sent') loadSentRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  useEffect(() => {
    if (tab !== 'add') return undefined
    if (searchQuery.trim().length < 2) {
      setSearchResults([])
      return undefined
    }

    const handle = window.setTimeout(async () => {
      setLoading(true)
      try {
        const data = await searchUsers(searchQuery.trim())
        setSearchResults(data.results || [])
      } catch {
        toast('Search failed', 'error')
      }
      setLoading(false)
    }, 300)

    return () => window.clearTimeout(handle)
  }, [searchQuery, tab, toast])

  const handleSendRequest = async (username) => {
    try {
      await sendFriendRequest(username)
      setSearchQuery('')
      setSearchResults([])
      toast('Friend request sent', 'success')
    } catch (err) {
      toast(err.message || 'Failed to send request', 'error')
    }
  }

  const handleResponse = async (id, action) => {
    setRespondingTo(id)
    try {
      await respondToFriendRequest(id, action)
      await loadRequests()
      await loadFriends()
      toast(action === 'accepted' ? 'Friend added' : 'Request declined', 'success')
    } catch {
      toast('Could not respond to that request', 'error')
    } finally {
      setRespondingTo(null)
    }
  }

  const handleRemoveFriend = async (friendId) => {
    if (!window.confirm('Remove this friend?')) return
    try {
      await removeFriend(friendId)
      await loadFriends()
      toast('Friend removed')
    } catch {
      toast('Could not remove friend', 'error')
    }
  }

  const handleCancelRequest = async (requestId) => {
    try {
      await cancelFriendRequest(requestId)
      await loadSentRequests()
      toast('Request cancelled')
    } catch {
      toast('Could not cancel request', 'error')
    }
  }

  const tabs = [
    { id: 'friends', label: `Friends (${friends.length})` },
    { id: 'requests', label: `Requests (${pendingRequests.length})` },
    { id: 'sent', label: `Sent (${sentRequests.length})` },
    { id: 'add', label: 'Add Friends' },
  ]

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Friends sections">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`border px-3 py-1.5 text-sm transition-colors ${
              tab === item.id ? 'border-ink bg-ink text-paper' : 'border-line bg-raised hover:border-ink'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'friends' && (
        <div>
          {loading ? (
            <p className="text-muted">Loading…</p>
          ) : friends.length > 0 ? (
            <ul className="divide-y divide-line border-y border-line">
              {friends.map((friend) => (
                <li key={friend._id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper-2 text-sm font-semibold text-ink">
                      {friend.name ? friend.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-ink truncate">{friend.name}</p>
                      <p className="text-xs text-muted truncate">@{friend.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {onSendTask && (
                      <button
                        type="button"
                        onClick={() => onSendTask(friend._id)}
                        className="border border-line bg-raised px-2.5 py-1 text-xs font-medium text-ink hover:border-ink transition-colors"
                      >
                        Send task
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveFriend(friend._id)}
                      className="text-xs text-muted hover:text-bad transition-colors px-1 py-1"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="border border-dashed border-line px-4 py-8 text-center">
              <p className="text-ink">No friends added yet.</p>
              <p className="mt-1 text-sm text-muted">
                Switch to the &ldquo;Add Friends&rdquo; tab to search for teammates and accountability partners.
              </p>
              <button
                type="button"
                onClick={() => setTab('add')}
                className="mt-3 inline-block bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
              >
                Find friends
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'requests' && (
        <div>
          {loading ? (
            <p className="text-muted">Loading…</p>
          ) : pendingRequests.length > 0 ? (
            <ul className="divide-y divide-line border-y border-line">
              {pendingRequests.map((request) => (
                <li key={request._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper-2 text-sm font-semibold text-ink">
                      {request.senderId?.name ? request.senderId.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-ink truncate">{request.senderId?.name}</p>
                      <p className="text-xs text-muted truncate">@{request.senderId?.username}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleResponse(request._id, 'accepted')}
                      disabled={respondingTo === request._id}
                      className="bg-ink px-3 py-1 text-sm text-paper disabled:opacity-60 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResponse(request._id, 'rejected')}
                      disabled={respondingTo === request._id}
                      className="border border-line bg-raised px-3 py-1 text-sm text-muted hover:border-ink hover:text-ink disabled:opacity-60 transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">No pending friend requests.</p>
          )}
        </div>
      )}

      {tab === 'sent' && (
        <div>
          {loading ? (
            <p className="text-muted">Loading…</p>
          ) : sentRequests.length > 0 ? (
            <ul className="divide-y divide-line border-y border-line">
              {sentRequests.map((request) => (
                <li key={request._id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-2 text-xs font-semibold text-ink">
                      {request.receiverId?.name ? request.receiverId.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-ink truncate">{request.receiverId?.name}</p>
                      <p className="text-xs text-muted truncate">@{request.receiverId?.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-xs capitalize font-medium ${
                        request.status === 'accepted'
                          ? 'bg-good/10 text-good'
                          : request.status === 'rejected'
                            ? 'bg-bad/10 text-bad'
                            : 'bg-paper-2 text-muted'
                      }`}
                    >
                      {request.status}
                    </span>
                    {request.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleCancelRequest(request._id)}
                        className="text-xs text-muted hover:text-bad underline-offset-2 hover:underline transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">You haven&apos;t sent any requests.</p>
          )}
        </div>
      )}

      {tab === 'add' && (
        <div>
          <label htmlFor="friend-search" className="mb-1 block text-sm font-medium text-ink">
            Search users by username
          </label>
          <input
            id="friend-search"
            type="search"
            placeholder="Start typing a username..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="mb-4 w-full border border-line bg-raised px-3 py-2 text-ink"
          />

          {loading ? (
            <p className="text-muted">Searching…</p>
          ) : searchResults.length > 0 ? (
            <ul className="divide-y divide-line border-y border-line">
              {searchResults.map((user) => (
                <li key={user._id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-2 text-xs font-semibold text-ink">
                      {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-ink truncate">{user.name}</p>
                      <p className="text-xs text-muted truncate">@{user.username}</p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {user.relationship === 'friend' ? (
                      <span className="border border-good/30 bg-good/10 px-2.5 py-1 text-xs font-medium text-good">
                        Friends
                      </span>
                    ) : user.relationship === 'pending_sent' ? (
                      <span className="border border-line bg-paper-2 px-2.5 py-1 text-xs text-muted">
                        Pending
                      </span>
                    ) : user.relationship === 'pending_received' ? (
                      <button
                        type="button"
                        onClick={() => handleResponse(user.requestId, 'accepted')}
                        className="bg-ink px-3 py-1 text-xs font-medium text-paper transition-colors"
                      >
                        Accept
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendRequest(user.username)}
                        className="bg-accent px-3 py-1 text-xs font-semibold text-white hover:bg-accent-hover transition-colors"
                      >
                        Add
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : searchQuery.trim().length >= 2 ? (
            <p className="text-muted">No users match that username.</p>
          ) : (
            <p className="text-muted">Type at least two characters to search for users.</p>
          )}
        </div>
      )}
    </div>
  )
}
