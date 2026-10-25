import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signup } from '../services/api'

export default function Signup() {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (name.trim().length < 1) {
      setError('Please provide your full name')
      return
    }

    if (username.length < 3 || username.length > 20) {
      setError('Username must be between 3 and 20 characters')
      return
    }

    if (!/^[a-z0-9_-]+$/i.test(username)) {
      setError('Username can only contain letters, numbers, underscores, and dashes')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const response = await signup(name.trim(), username.trim().toLowerCase(), email.trim(), password)
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 py-12 selection:bg-accent/20">
      <main id="main" className="w-full max-w-md border border-line bg-raised p-8 shadow-xs sm:rounded-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xs bg-ink text-paper font-display text-xs font-bold">
            DT
          </div>
          <span className="text-xs font-semibold tracking-wider text-accent uppercase">
            DailyTrack
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold text-ink">Create Account</h1>
        <p className="mt-1.5 text-xs text-muted">
          Build lasting habits, review daily performance, and keep friends accountable.
        </p>

        {error && (
          <div
            className="mt-5 border border-bad/30 bg-bad/10 px-3.5 py-2.5 text-xs font-medium text-bad"
            role="alert"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-xs font-semibold text-ink uppercase tracking-wider">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Alex Rivers"
              className="w-full border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted/50 focus:border-accent"
              required
            />
          </div>

          <div>
            <label htmlFor="username" className="mb-1 block text-xs font-semibold text-ink uppercase tracking-wider">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value.toLowerCase())}
              placeholder="e.g. alexrivers"
              maxLength={20}
              className="w-full border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted/50 focus:border-accent"
              required
            />
            <p className="mt-1 text-[11px] text-muted">3–20 characters. Letters, numbers, _ and -.</p>
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-semibold text-ink uppercase tracking-wider">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="alex@example.com"
              className="w-full border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted/50 focus:border-accent"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-xs font-semibold text-ink uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-muted hover:text-ink transition-colors"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              className="w-full border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-accent"
              required
            />
            <p className="mt-1 text-[11px] text-muted">Minimum 6 characters.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 border-t border-line pt-4 text-center">
          <p className="text-xs text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-accent underline-offset-2 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
