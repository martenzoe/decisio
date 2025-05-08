import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    setMessage('⏳ Registrierung läuft...')

    try {
      const res = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Registrierung fehlgeschlagen')

      setMessage('✅ Registrierung erfolgreich! Jetzt einloggen...')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      console.error(err)
      setMessage(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#A7D7C5]">
      <div className="bg-white p-10 rounded-lg shadow-md w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-center text-[#212B27]">Register</h2>
        <form onSubmit={handleRegister} className="space-y-4">
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
            Register
          </button>
        </form>
        {message && <p className="text-center text-sm text-gray-700">{message}</p>}
        <p className="text-sm text-center text-[#32403B]">
          Already have an account?{' '}
          <Link to="/login" className="text-[#32403B] underline font-semibold">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register
