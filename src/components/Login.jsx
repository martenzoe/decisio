import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

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
      const res = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Login failed')

      // Token speichern
      localStorage.setItem('token', data.token)

      // Benutzer lokal speichern
      setUser({ email })

      setMessage('✅ Login erfolgreich!')
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
      setMessage(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#A7D7C5]">
      <div className="bg-white p-10 rounded-lg shadow-md w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-center text-[#212B27]">Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
          <input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
          <button
            type="submit"
            className="w-full bg-[#84C7AE] hover:bg-[#6DB99F] text-white py-2 rounded font-semibold"
          >
            Login
          </button>
        </form>
        {message && <p className="text-center text-sm text-gray-700">{message}</p>}
      </div>
    </div>
  )
}

export default Login
