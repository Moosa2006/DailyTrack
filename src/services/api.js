const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim()

export const resolveApiBaseUrl = (rawUrl) => {
  if (!rawUrl) {
    return '/api'
  }
  const stripped = rawUrl.replace(/\/+$/, '')
  if (stripped.endsWith('/api')) {
    return stripped
  }
  return `${stripped}/api`
}

export const API_BASE_URL = resolveApiBaseUrl(rawApiUrl)

class ApiError extends Error {
  constructor(message, status, body) {
    super(message)
    this.status = status
    this.body = body
  }
}

export const apiCall = async (endpoint, method = 'GET', data = null) => {
  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const config = {
    method,
    headers,
  }

  if (data !== null && method !== 'GET') {
    config.body = JSON.stringify(data)
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const response = await fetch(`${API_BASE_URL}${cleanEndpoint}`, config)
  const body = await response.json().catch(() => ({}))

  if (response.status === 401 && !endpoint.startsWith('/auth/')) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    if (!window.location.pathname.startsWith('/login')) {
      window.location.assign('/login')
    }
  }

  if (!response.ok) {
    throw new ApiError(body.message || 'Request failed', response.status, body)
  }

  return body
}

export const signup = (name, username, email, password) =>
  apiCall('/auth/signup', 'POST', { name, username, email, password })

export const login = (email, password) =>
  apiCall('/auth/login', 'POST', { email, password })

export const getTasks = () => apiCall('/tasks', 'GET')
export const createTask = (title, category = 'General') =>
  apiCall('/tasks', 'POST', { title, category })
export const updateTask = (id, title, category) =>
  apiCall(`/tasks/${id}`, 'PUT', { title, category })
export const deleteTask = (id) => apiCall(`/tasks/${id}`, 'DELETE')

export const saveLog = (date, tasks, notes) =>
  apiCall('/log', 'POST', { date, tasks, notes })

export const getLog = (date) => apiCall(`/log/${date}`, 'GET')

export const getDashboard = (date) =>
  apiCall(date ? `/dashboard?date=${encodeURIComponent(date)}` : '/dashboard', 'GET')

export const sendSharedTask = (receiverIds, title) =>
  apiCall('/shared/send', 'POST', { receiverIds, title })

export const getIncomingTasks = () => apiCall('/shared/incoming', 'GET')

export const getSentTasks = () => apiCall('/shared/sent', 'GET')

export const getAllSharedTasks = () => apiCall('/shared/all', 'GET')

export const respondToSharedTask = (id, action) =>
  apiCall(`/shared/respond/${id}`, 'POST', { action })

export const getTaskProgress = () => apiCall('/shared/progress', 'GET')

export const sendFriendRequest = (username) =>
  apiCall('/friends/request', 'POST', { username })

export const getFriendsList = () => apiCall('/friends/list', 'GET')

export const getPendingRequests = () => apiCall('/friends/requests/pending', 'GET')

export const getSentRequests = () => apiCall('/friends/requests/sent', 'GET')

export const respondToFriendRequest = (id, action) =>
  apiCall(`/friends/respond/${id}`, 'POST', { action })

export const removeFriend = (friendId) =>
  apiCall(`/friends/${friendId}`, 'DELETE')

export const cancelFriendRequest = (id) =>
  apiCall(`/friends/requests/${id}`, 'DELETE')

export const searchUsers = (username) =>
  apiCall(`/users/search?username=${encodeURIComponent(username)}`, 'GET')

export const getCurrentUserProfile = () =>
  apiCall('/users/profile/me', 'GET')

export const getUserProfile = (username) =>
  apiCall(`/users/profile/${username}`, 'GET')
