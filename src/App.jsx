import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Login from './components/Login'
import Register from './components/Register'
import Logout from './components/Logout'
import { useEffect } from 'react'
import { useAuthStore } from './store/useAuthStore'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import NewDecision from './pages/NewDecision'
import Evaluation from './pages/Evaluation'
import History from './pages/History'
import DecisionDetail from './pages/DecisionDetail'
import EditDecision from './pages/EditDecision'
import EvaluateDecision from './pages/EvaluateDecision'

function App() {
  const { user, setUser } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setUser({ token })
    }
  }, [setUser])

  // Seiten, auf denen KEINE Navbar angezeigt werden soll
  const hideNavbar = location.pathname === '/login' || location.pathname === '/register'

  return (
    <div className="p-6">
      {!hideNavbar && (
        <nav className="flex gap-4 mb-6">
          <Link to="/">Home</Link>
          {!user && <Link to="/login">Login</Link>}
          {!user && <Link to="/register">Register</Link>}
          {user && <Link to="/dashboard">Dashboard</Link>}
          {user && <Logout />}
        </nav>
      )}

      <Routes>
        <Route path="/" element={<h1 className="text-2xl">Startseite</h1>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/new-decision"
          element={
            <ProtectedRoute>
              <NewDecision />
            </ProtectedRoute>
          }
        />
        <Route
          path="/evaluation"
          element={
            <ProtectedRoute>
              <Evaluation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />
        <Route
          path="/decision/:id"
          element={
            <ProtectedRoute>
              <DecisionDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/decision/:id/edit"
          element={
            <ProtectedRoute>
              <EditDecision />
            </ProtectedRoute>
          }
        />
        <Route
          path="/decision/:id/evaluate"
          element={
            <ProtectedRoute>
              <EvaluateDecision />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}

export default App
