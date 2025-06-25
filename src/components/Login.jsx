import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { loginUser } from '../api/auth'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()
  const { setUser } = useAuthStore()

  const handleLogin = async (e) => {
    e.preventDefault()
    setMessage('⏳ Logging in...')

    try {
      const { token, user } = await loginUser(email, password)
      localStorage.setItem('token', token)
      setUser(user)
      setMessage('✅ Login erfolgreich!')
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
      setMessage(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-white relative">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-[#4F46E5] z-0" />
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800">Welcome back</h1>
            <p className="text-sm text-gray-500">Sign in to your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                placeholder="mail@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#4F46E5] text-white py-2 rounded-lg font-semibold hover:bg-[#4338CA] transition"
            >
              Sign in
            </button>
          </form>

          {message && <p className="text-sm text-center text-gray-600">{message}</p>}

          <p className="text-sm text-center text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#4F46E5] font-semibold hover:underline">
              Register now
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
