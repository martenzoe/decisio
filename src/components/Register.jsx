import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Link } from 'react-router-dom'

function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleRegister = async (e) => {
    e.preventDefault()
    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Bitte bestätige deine E-Mail-Adresse.')
    }
  }

  return (
    <div className="fixed inset-0 bg-[#A7D7C5] flex items-center justify-center overflow-hidden">
      {/* Linke Deko-Form */}
      <div className="absolute w-[900px] h-[900px] bg-[#C1E3D6] rounded-[160px] rotate-[-45deg] -left-[450px] top-1/2 -translate-y-1/2 opacity-50" />
      {/* Rechte Deko-Form */}
      <div className="absolute w-[900px] h-[900px] bg-[#C1E3D6] rounded-[160px] rotate-[-45deg] -right-[450px] top-1/2 -translate-y-1/2 opacity-50" />

      {/* Register Card */}
      <div className="relative z-10 bg-[#F6FBF9] rounded-3xl shadow-2xl p-10 w-[90%] max-w-md flex flex-col items-center">
        <h1 className="text-3xl font-bold text-[#212B27] mb-4 text-center">Create An Account</h1>
        <p className="text-center text-[#32403B] mb-8">
          Create an account to enjoy all the services without any ads for free!
        </p>

        <form onSubmit={handleRegister} className="space-y-6 w-full">
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
            Create Account
          </button>
        </form>

        {message && (
          <p className="mt-4 text-sm text-[#32403B] text-center">{message}</p>
        )}

        <p className="mt-6 text-sm text-center text-[#32403B]">
          Already have an account?{' '}
          <Link to="/login" className="text-[#32403B] underline font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register
