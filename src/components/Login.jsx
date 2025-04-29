import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const { user } = useAuthStore()

  const handleLogin = async (e) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('✅ Login erfolgreich!')
      navigate('/dashboard')
    }
  }

  if (user) {
    navigate('/dashboard')
    return null
  }

  return (
    <div className="fixed inset-0 bg-[#A7D7C5] flex items-center justify-center overflow-hidden">
      {/* Linke Deko-Form */}
      <div className="absolute w-[900px] h-[900px] bg-[#C1E3D6] rounded-[160px] rotate-[-45deg] -left-[450px] top-1/2 -translate-y-1/2 opacity-50" />
      {/* Rechte Deko-Form */}
      <div className="absolute w-[900px] h-[900px] bg-[#C1E3D6] rounded-[160px] rotate-[-45deg] -right-[450px] top-1/2 -translate-y-1/2 opacity-50" />

      {/* Login Card */}
      <div className="relative z-10 bg-[#F6FBF9] rounded-3xl shadow-2xl p-10 w-[90%] max-w-md flex flex-col items-center">
        <h1 className="text-3xl font-bold text-[#212B27] mb-4 text-center">Welcome Back</h1>
        <p className="text-center text-[#32403B] mb-8">
          Log in to access your dashboard and manage your decisions!
        </p>

        <form onSubmit={handleLogin} className="space-y-6 w-full">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84C7AE] bg-gray-100"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84C7AE] bg-gray-100"
            required
          />
          <button
            type="submit"
            className="w-full bg-[#84C7AE] hover:bg-[#6DB99F] text-white font-bold py-3 rounded-lg text-lg transition-all"
          >
            Login
          </button>
        </form>

        {message && (
          <p className="mt-4 text-sm text-[#32403B] text-center">{message}</p>
        )}

        <p className="mt-6 text-sm text-center text-[#32403B]">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#32403B] underline font-semibold">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login
