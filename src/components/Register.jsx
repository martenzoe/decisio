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
      setMessage('✅ Bitte bestätige deine E-Mail-Adresse.')
    }
  }

  return (
    <div className="min-h-screen bg-[#A7D7C5] flex items-center justify-center relative overflow-hidden">
      
      {/* Hintergrund-Formen */}
      <div className="absolute w-[750px] h-[750px] bg-[#C1E3D6] rounded-[160px] rotate-[-45deg] -left-[250px] top-20" />
      <div className="absolute w-[750px] h-[750px] bg-[#C1E3D6] rounded-[160px] rotate-[-45deg] right-[-250px] bottom-20" />
      
      {/* Formular-Card */}
      <div className="bg-[#F6FBF9] rounded-[49px] shadow-xl p-12 w-full max-w-md z-10 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-[#212B27] mb-4">Create An Account</h1>
        <p className="text-[#32403B] mb-8 text-sm md:text-base">
          Create an account to enjoy all the services without any ads for free!
        </p>

        {/* Formular */}
        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84C7AE]"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84C7AE]"
            required
          />
          <button
            type="submit"
            className="w-full bg-[#84C7AE] hover:bg-[#6DB99F] text-white font-bold py-3 rounded-lg text-lg transition-all"
          >
            Create Account
          </button>
        </form>

        {/* Statusnachricht */}
        {message && (
          <p className="mt-4 text-sm text-[#32403B]">{message}</p>
        )}

        <p className="mt-6 text-sm text-[#32403B]">
          Already Have An Account?{' '}
          <Link to="/login" className="text-[#32403B] underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register
