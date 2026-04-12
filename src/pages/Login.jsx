import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../services/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await login(email, password)
      
      if (response.token) {
        localStorage.setItem('token', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))
        navigate('/dashboard')
      } else {
        setError(response.message || 'Login failed')
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Login</h1>
        
        {error && <div className="bg-red-500 text-white p-3 rounded mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded transition"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <p className="text-gray-400 mt-4 text-center">
          Don't have an account? <Link to="/signup" className="text-green-400 hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
