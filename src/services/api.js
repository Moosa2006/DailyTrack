const API_URL = import.meta.env.VITE_API_URL || '/api'

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

  if (data) {
    config.body = JSON.stringify(data)
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config)
    if (response.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return await response.json()
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

// Auth API
export const signup = (name, username, email, password) =>
  apiCall('/auth/signup', 'POST', { name, username, email, password })

export const login = (email, password) =>
  apiCall('/auth/login', 'POST', { email, password })

// Tasks API
export const getTasks = () => apiCall('/tasks', 'GET')
export const createTask = (title) => apiCall('/tasks', 'POST', { title })
export const updateTask = (id, title) => apiCall(`/tasks/${id}`, 'PUT', { title })
export const deleteTask = (id) => apiCall(`/tasks/${id}`, 'DELETE')

// Daily Log API
export const saveLog = (date, tasks, notes) =>
  apiCall('/log', 'POST', { date, tasks, notes })

export const getLog = (date) => apiCall(`/log/${date}`, 'GET')

// Dashboard API
export const getDashboard = () => apiCall('/dashboard', 'GET')

// Shared Tasks API (Updated for multiple receivers)
export const sendSharedTask = (receiverIds, title) =>
  apiCall('/shared/send', 'POST', { receiverIds, title })

export const getIncomingTasks = () => apiCall('/shared/incoming', 'GET')

export const getSentTasks = () => apiCall('/shared/sent', 'GET')

export const getAllSharedTasks = () => apiCall('/shared/all', 'GET')

export const respondToSharedTask = (id, action) =>
  apiCall(`/shared/respond/${id}`, 'POST', { action })

export const getTaskProgress = () => apiCall('/shared/progress', 'GET')

// Friends API
export const sendFriendRequest = (username) =>
  apiCall('/friends/request', 'POST', { username })

export const getFriendsList = () => apiCall('/friends/list', 'GET')

export const getPendingRequests = () => apiCall('/friends/requests/pending', 'GET')

export const getSentRequests = () => apiCall('/friends/requests/sent', 'GET')

export const respondToFriendRequest = (id, action) =>
  apiCall(`/friends/respond/${id}`, 'POST', { action })

export const removeFriend = (friendId) =>
  apiCall(`/friends/${friendId}`, 'DELETE')

// Users API (Search & Profile)
export const searchUsers = (username) =>
  apiCall(`/users/search?username=${username}`, 'GET')

export const getCurrentUserProfile = () =>
  apiCall('/users/profile/me', 'GET')

export const getUserProfile = (username) =>
  apiCall(`/users/profile/${username}`, 'GET')
