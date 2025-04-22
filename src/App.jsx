import { Routes, Route, Link } from 'react-router-dom'
import Login from './components/Login'
import Register from './components/Register'
import Logout from './components/Logout'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'

function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
    }

    getUser()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  return (
    <div className="p-6">
      <nav className="flex gap-4 mb-6">
        <Link to="/">Home</Link>
        {!user && <Link to="/login">Login</Link>}
        {!user && <Link to="/register">Register</Link>}
        {user && <Link to="/dashboard">Dashboard</Link>}
        {user && <Logout />}
      </nav>

      <Routes>
        <Route path="/" element={<h1 className="text-2xl">Startseite</h1>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<h2>🎯 Dashboard (später geschützt)</h2>} />
      </Routes>
    </div>
  )
}

export default App
