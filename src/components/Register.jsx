// src/components/Register.jsx
import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { registerUser } from '../api/auth'

function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  // Invite-Token aus URL speichern (falls vorhanden)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const inviteToken = params.get('token') || params.get('inviteToken')
    if (inviteToken) {
      localStorage.setItem('pendingInviteToken', inviteToken)
      localStorage.setItem('inviteTokenFresh', 'true')
    }
  }, [location.search])

  const handleRegister = async (e) => {
    e.preventDefault()
    setMessage('⏳ Account wird erstellt …')
    try {
      const inviteToken = localStorage.getItem('pendingInviteToken')
      await registerUser(email, password, inviteToken)
      setMessage('✅ Account erfolgreich erstellt!')
      setTimeout(() => {
        const isFresh = localStorage.getItem('inviteTokenFresh') === 'true'
        if (inviteToken && isFresh) {
          localStorage.removeItem('pendingInviteToken')
          localStorage.removeItem('inviteTokenFresh')
          navigate(`/invite?token=${inviteToken}`)
        } else {
          navigate('/login')
        }
      }, 800)
    } catch (err) {
      console.error(err)
      setMessage(err.message || 'Fehler bei der Registrierung')
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 relative">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-[#4F46E5] z-0" />
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6 text-gray-900 dark:text-gray-100">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Create your account</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Start your journey with Decisia
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]
                           bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                placeholder="mail@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]
                           bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#4F46E5] text-white py-2 rounded-lg font-semibold hover:bg-[#4338CA] transition"
            >
              Sign up
            </button>
          </form>

          {message && (
            <p className="text-sm text-center text-gray-600 dark:text-gray-300">
              {message}
            </p>
          )}

          <p className="text-sm text-center text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-[#4F46E5] font-semibold hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
