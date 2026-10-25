import { useEffect, useState } from 'react'
import { getFriendsList, sendSharedTask, createTask } from '../services/api'
import Modal from './Modal'
import { useToast } from './Toast'

export default function SendTaskModal({ onTaskSent, onClose, preselectedFriendId = null }) {
  const [friends, setFriends] = useState([])
  const [selectedFriends, setSelectedFriends] = useState(
    preselectedFriendId ? [preselectedFriendId] : []
  )
  const [title, setTitle] = useState('')
  const [addToSelf, setAddToSelf] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()

  useEffect(() => {
    const loadFriends = async () => {
      try {
        const data = await getFriendsList()
        setFriends(data.friends || [])
      } catch {
        setError('Failed to load friends')
      }
    }
    loadFriends()
  }, [])

  const toggleFriend = (friendId) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (selectedFriends.length === 0) {
      setError('Select at least one friend')
      return
    }

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('Enter a task title')
      return
    }

    setLoading(true)
    const count = selectedFriends.length

    try {
      const response = await sendSharedTask(selectedFriends, trimmedTitle)
      if (addToSelf) {
        try {
          await createTask(trimmedTitle, 'Shared')
        } catch {
          // non-blocking
        }
      }
      toast(response.message || `Sent to ${count} friend${count === 1 ? '' : 's'}`, 'success')
      onTaskSent?.()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to send task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Send a task" onClose={onClose}>
      {error && (
        <div className="mb-4 border border-bad/30 px-3 py-2 text-sm text-bad" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="task-title" className="mb-1 block text-sm font-medium">
            Task
          </label>
          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Study for 2 hours"
            maxLength={200}
            className="w-full border border-line bg-paper px-3 py-2"
            disabled={loading}
          />
        </div>

        <fieldset>
          <div className="mb-2 flex items-center justify-between">
            <legend className="text-sm font-medium text-ink">
              Choose friends {selectedFriends.length > 0 && `(${selectedFriends.length})`}
            </legend>
            {friends.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setSelectedFriends(
                    selectedFriends.length === friends.length
                      ? []
                      : friends.map((f) => f._id)
                  )
                }
                className="text-xs text-accent hover:underline"
              >
                {selectedFriends.length === friends.length ? 'Deselect all' : 'Select all'}
              </button>
            )}
          </div>
          {friends.length > 0 ? (
            <div className="max-h-48 space-y-1 overflow-y-auto border border-line bg-paper/50 p-2">
              {friends.map((friend) => {
                const isChecked = selectedFriends.includes(friend._id)
                return (
                  <label
                    key={friend._id}
                    className={`flex cursor-pointer items-center gap-3 rounded-sm px-2.5 py-1.5 transition-colors ${
                      isChecked ? 'bg-paper font-medium' : 'hover:bg-paper'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleFriend(friend._id)}
                      disabled={loading}
                      className="h-4 w-4 accent-good"
                    />
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-paper-2 text-xs font-semibold text-ink">
                      {friend.name ? friend.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">{friend.name}</span>
                      <span className="block truncate text-xs text-muted">@{friend.username}</span>
                    </span>
                  </label>
                )
              })}
            </div>
          ) : (
            <p className="border border-dashed border-line p-4 text-center text-sm text-muted">
              You haven&apos;t added any friends yet. Add friends from the Friends tab first!
            </p>
          )}
        </fieldset>

        <label className="flex cursor-pointer items-center gap-2.5 pt-1 text-sm text-ink">
          <input
            type="checkbox"
            checked={addToSelf}
            onChange={(e) => setAddToSelf(e.target.checked)}
            className="h-4 w-4 accent-good"
          />
          <span>Also add this habit to my own checklist</span>
        </label>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={loading || friends.length === 0}
            className="flex-1 bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? 'Sending…' : `Send to ${selectedFriends.length || 0} friend${selectedFriends.length === 1 ? '' : 's'}`}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="border border-line bg-raised px-4 py-2.5 text-sm text-muted transition-colors hover:border-ink hover:text-ink"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}
