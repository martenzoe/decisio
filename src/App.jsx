import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/useAuthStore'

// Auth
import Login from './components/Login'
import Register from './components/Register'
import Logout from './components/Logout'
import ProtectedRoute from './components/ProtectedRoute'

// Layout
import MainLayout from './layouts/MainLayout'

// Seiten
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import NewDecision from './pages/NewDecision'
import Evaluation from './pages/Evaluation'
import History from './pages/History'
import DecisionDetail from './pages/DecisionDetail'
import EditDecision from './pages/EditDecision'
import EditTeamDecision from './pages/EditTeamDecision'   // <--- NEU
import EvaluateDecision from './pages/EvaluateDecision'
import Faq from './pages/Faq'
import Kontakt from './pages/Kontakt'
import Impressum from './pages/Impressum'
import Datenschutz from './pages/Datenschutz'
import Profile from './pages/Profile'
import ChangePassword from './pages/ChangePassword'
import NewTeamDecision from './pages/NewTeamDecision'
import Invite from './pages/Invite'
import TeamInvite from './pages/TeamInvite'
import NotificationsPage from './pages/NotificationsPage'
import TeamDecisionDetail from './pages/TeamDecisionDetail'
import DecisionRouter from './pages/DecisionRouter'

// NEU: Use Cases Seite
import UseCases from './pages/UseCases'

function App() {
  const loadUserFromToken = useAuthStore((state) => state.loadUserFromToken)
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    console.log('🔄 App startet – lade Benutzerprofil ...')
    loadUserFromToken()
  }, [])

  useEffect(() => {
    console.log('👤 Aktueller Benutzerzustand:', user)
  }, [user])

  return (
    <div className="min-h-screen">
      <Routes>
        {/* 🌐 Öffentliche Seiten */}
        <Route path="/" element={<MainLayout><Home /></MainLayout>} />
        <Route path="/use-cases" element={<MainLayout><UseCases /></MainLayout>} /> {/* ⇐ NEU */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/faq" element={<MainLayout><Faq /></MainLayout>} />
        <Route path="/kontakt" element={<MainLayout><Kontakt /></MainLayout>} />
        <Route path="/impressum" element={<MainLayout><Impressum /></MainLayout>} />
        <Route path="/datenschutz" element={<MainLayout><Datenschutz /></MainLayout>} />
        <Route path="/invite" element={<Invite />} />
        <Route path="/notifications" element={<NotificationsPage />} />

        {/* 🔐 Geschützte Seiten */}
        <Route path="/dashboard" element={<ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
        <Route path="/new-decision" element={<ProtectedRoute><MainLayout><NewDecision /></MainLayout></ProtectedRoute>} />
        <Route path="/new-team-decision" element={<ProtectedRoute><MainLayout><NewTeamDecision /></MainLayout></ProtectedRoute>} />
        <Route path="/team-invite/:id" element={<ProtectedRoute><MainLayout><TeamInvite /></MainLayout></ProtectedRoute>} />
        <Route path="/evaluation" element={<ProtectedRoute><MainLayout><Evaluation /></MainLayout></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><MainLayout><History /></MainLayout></ProtectedRoute>} />

        {/* 🧠 Entscheidungs-Router entscheidet zwischen Einzel- oder Teamentscheidung */}
        <Route path="/decision/:id" element={<ProtectedRoute><MainLayout><DecisionRouter /></MainLayout></ProtectedRoute>} />

        {/* 🔎 Zielseiten für den Router */}
        <Route path="/single-decision/:id" element={<ProtectedRoute><MainLayout><DecisionDetail /></MainLayout></ProtectedRoute>} />
        <Route path="/team-decision/:id" element={<ProtectedRoute><MainLayout><TeamDecisionDetail /></MainLayout></ProtectedRoute>} />

        {/* 🔧 Weitere Detailseiten */}
        <Route path="/decision/:id/edit" element={<ProtectedRoute><MainLayout><EditDecision /></MainLayout></ProtectedRoute>} />
        <Route path="/team-decision/:id/edit" element={<ProtectedRoute><MainLayout><EditTeamDecision /></MainLayout></ProtectedRoute>} /> {/* NEU */}
        <Route path="/decision/:id/evaluate" element={<ProtectedRoute><MainLayout><EvaluateDecision /></MainLayout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><MainLayout><Profile /></MainLayout></ProtectedRoute>} />
        <Route path="/change-password" element={<ProtectedRoute><MainLayout><ChangePassword /></MainLayout></ProtectedRoute>} />
      </Routes>
    </div>
  )
}

export default App
