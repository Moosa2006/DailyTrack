import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTasks, createTask, deleteTask, saveLog, getDashboard } from '../services/api'
import ShareModal from '../components/ShareModal'
import SendTaskModal from '../components/SendTaskModal'
import IncomingTasksSection from '../components/IncomingTasksSection'
import SentTasksSection from '../components/SentTasksSection'
import FriendsPanel from '../components/FriendsPanel'
import ProgressTracker from '../components/ProgressTracker'

export default function Dashboard() {
  const [tasks, setTasks] = useState([])
  const [dailyTasks, setDailyTasks] = useState([])
  const [taskInput, setTaskInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [stats, setStats] = useState(null)
  const [notes, setNotes] = useState('')
  const [showShareModal, setShowShareModal] = useState(false)
  const [showSendTaskModal, setShowSendTaskModal] = useState(false)
  const [sharedTasksRefresh, setSharedTasksRefresh] = useState(0)
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // Load initial data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Get all tasks
      const tasksData = await getTasks()
      setTasks(tasksData)
      
      // Initialize daily tasks (copy of all tasks for today)
      const initialDailyTasks = tasksData.map(task => ({
        taskId: task._id,
        title: task.title,
        completed: false,
      }))
      setDailyTasks(initialDailyTasks)
      
      // Get dashboard stats
      const dashboardData = await getDashboard()
      setStats(dashboardData)
      setCompletionPercentage(dashboardData.todayCompletion)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTask = async () => {
    if (!taskInput.trim()) return

    try {
      const newTask = await createTask(taskInput)
      setTasks([...tasks, newTask])
      setDailyTasks([...dailyTasks, { taskId: newTask._id, title: newTask.title, completed: false }])
      setTaskInput('')
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  const toggleTask = (taskId) => {
    const updated = dailyTasks.map(task =>
      task.taskId === taskId ? { ...task, completed: !task.completed } : task
    )
    setDailyTasks(updated)
    
    // Calculate completion percentage
    const completed = updated.filter(t => t.completed).length
    const percentage = updated.length > 0 ? Math.round((completed / updated.length) * 100) : 0
    setCompletionPercentage(percentage)
  }

  const deleteTaskFn = async (taskId) => {
    try {
      await deleteTask(taskId)
      setTasks(tasks.filter(t => t._id !== taskId))
      setDailyTasks(dailyTasks.filter(t => t.taskId !== taskId))
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const saveDaily = async () => {
    try {
      setSaving(true)
      const today = new Date().toISOString().split('T')[0]
      await saveLog(today, dailyTasks, notes)
      alert('Daily log saved!')
    } catch (error) {
      console.error('Error saving log:', error)
      alert('Failed to save log')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <p className="text-xl">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 py-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Welcome, {user.name}</h1>
            <p className="text-gray-400 mt-1 text-sm md:text-base">@{user.username} • Track your daily habits with friends</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition whitespace-nowrap"
          >
            Logout
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 p-4 rounded-lg text-center">
              <p className="text-gray-400 text-sm mb-2">Today</p>
              <p className="text-4xl font-bold text-green-400">{stats.todayCompletion}%</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg text-center">
              <p className="text-gray-400 text-sm mb-2">Weekly Avg</p>
              <p className="text-4xl font-bold text-blue-400">{stats.weeklyAverage}%</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg text-center">
              <p className="text-gray-400 text-sm mb-2">Current Streak</p>
              <p className="text-4xl font-bold text-yellow-400">{stats.currentStreak} days</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg text-center">
              <p className="text-gray-400 text-sm mb-2">Best Streak</p>
              <p className="text-4xl font-bold text-purple-400">{stats.longestStreak} days</p>
            </div>
          </div>
        )}

        {/* Main Completion Display */}
        <div className="bg-linear-to-r from-green-600 to-green-700 px-4 py-6 md:p-8 rounded-lg mb-8 text-center">
          <p className="text-base md:text-lg text-white opacity-90 mb-2">Today's Completion</p>
          <p className="text-6xl md:text-7xl font-bold text-white">{completionPercentage}%</p>
          <div className="w-full bg-green-900 h-2 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
            <button
              onClick={() => setShowShareModal(true)}
              className="bg-white text-green-700 hover:bg-gray-100 font-bold py-2 px-6 rounded transition w-full sm:w-auto"
            >
              🎉 Share Achievement
            </button>
            <button
              onClick={() => setShowSendTaskModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded transition w-full sm:w-auto"
            >
              📤 Send Task to Friend
            </button>
          </div>
        </div>

        {/* Incoming Tasks Section */}
        <IncomingTasksSection 
          refreshTrigger={sharedTasksRefresh}
          onTaskAccepted={() => {
            loadData()
            setSharedTasksRefresh(prev => prev + 1)
          }}
        />

        {/* Sent Tasks Section */}
        <SentTasksSection refreshTrigger={sharedTasksRefresh} />

        {/* Friends Panel */}
        <div className="mb-8">
          <FriendsPanel />
        </div>

        {/* Progress Tracker */}
        <div className="mb-8">
          <ProgressTracker />
        </div>

        {/* Add Task */}
        <div className="bg-gray-800 px-4 py-6 md:p-6 rounded-lg mb-8">
          <h2 className="text-xl md:text-2xl font-bold mb-4">Add New Task</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
              placeholder="Enter a new habit or task..."
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
            />
            <button
              onClick={addTask}
              className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded transition font-bold w-full sm:w-auto"
            >
              Add
            </button>
          </div>
        </div>

        {/* Today's Tasks (Daily Checklist) */}
        <div className="bg-gray-800 px-4 py-6 md:p-6 rounded-lg mb-8">
          <h2 className="text-xl md:text-2xl font-bold mb-4">Today's Tasks</h2>
          {dailyTasks.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No tasks yet. Add one to get started!</p>
          ) : (
            <ul className="space-y-3">
              {dailyTasks.map(task => (
                <li key={task.taskId} className="flex items-center gap-3 bg-gray-700 px-3 py-3 rounded hover:bg-gray-600 transition flex-wrap md:flex-nowrap">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.taskId)}
                    className="w-5 h-5 rounded cursor-pointer accent-green-500 shrink-0"
                  />
                  <span className={`flex-1 min-w-0 text-sm md:text-base ${task.completed ? 'line-through text-gray-400' : 'text-white'}`}>
                    {task.title}
                  </span>
                  <button
                    onClick={() => deleteTaskFn(task.taskId)}
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition w-full md:w-auto"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Notes Section */}
        <div className="bg-gray-800 px-4 py-6 md:p-6 rounded-lg mb-8">
          <h2 className="text-xl md:text-2xl font-bold mb-4">Daily Notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about today..."
            className="w-full px-4 py-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-green-500 h-24 text-sm md:text-base"
          />
        </div>

        {/* Save Daily Log */}
        <button
          onClick={saveDaily}
          disabled={saving}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded transition text-base md:text-lg"
        >
          {saving ? 'Saving...' : `Save Daily Log (${completionPercentage}% completed)`}
        </button>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal completion={completionPercentage} onClose={() => setShowShareModal(false)} />
      )}

      {/* Send Task Modal */}
      {showSendTaskModal && (
        <SendTaskModal 
          onTaskSent={() => setSharedTasksRefresh(prev => prev + 1)}
          onClose={() => setShowSendTaskModal(false)}
        />
      )}
    </div>
  )
}
