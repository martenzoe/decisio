// src/App.jsx
import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/useAuthStore'

import Login from './components/Login'
import Register from './components/Register'
import Logout from './components/Logout'
import ProtectedRoute from './components/ProtectedRoute'

import MainLayout from './layouts/MainLayout'

import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import NewDecision from './pages/NewDecision'
import Evaluation from './pages/Evaluation'
import History from './pages/History'
import DecisionDetail from './pages/DecisionDetail'
import EditDecision from './pages/EditDecision'
import EvaluateDecision from './pages/EvaluateDecision'
import Faq from './pages/Faq'
import Kontakt from './pages/Kontakt'
import Impressum from './pages/Impressum'
import Datenschutz from './pages/Datenschutz'

import Profile from './pages/Profile'
import ChangePassword from './pages/ChangePassword'


function App() {
  const { user, setUser } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setUser({ token })
    }
  }, [setUser])

  return (
    <div className="min-h-screen">
      <Routes>
        <Route
          path="/"
          element={
            <MainLayout>
              <Home />
            </MainLayout>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/new-decision"
          element={
            <ProtectedRoute>
              <MainLayout>
                <NewDecision />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/evaluation"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Evaluation />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <MainLayout>
                <History />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/decision/:id"
          element={
            <ProtectedRoute>
              <MainLayout>
                <DecisionDetail />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/decision/:id/edit"
          element={
            <ProtectedRoute>
              <MainLayout>
                <EditDecision />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/decision/:id/evaluate"
          element={
            <ProtectedRoute>
              <MainLayout>
                <EvaluateDecision />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/faq"
          element={
            <MainLayout>
              <Faq />
            </MainLayout>
          }
        />
        <Route
          path="/kontakt"
          element={
            <MainLayout>
              <Kontakt />
            </MainLayout>
          }
        />
        <Route
          path="/impressum"
          element={
            <MainLayout>
              <Impressum />
            </MainLayout>
          }
        />
        <Route
          path="/datenschutz"
          element={
            <MainLayout>
              <Datenschutz />
            </MainLayout>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Profile />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ChangePassword />
              </MainLayout>
            </ProtectedRoute>
          }
        />

      </Routes>
      
    </div>
  )
}

export default App
