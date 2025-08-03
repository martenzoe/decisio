// src/pages/DecisionRouter.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

function DecisionRouter() {
  const { id } = useParams()
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      console.warn('⚠️ Kein Token – redirect zu Login')
      navigate('/login')
      return
    }

    const checkTypeAndRedirect = async () => {
      try {
        const res = await fetch(`/api/decision/${id}/type`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        const data = await res.json()
        console.log('📦 Entscheidung geladen:', data)

        if (!res.ok) throw new Error(data.error || 'Fehler beim Laden')

        const isTeam = data.is_team
        if (isTeam) {
          navigate(`/team-decision/${id}`, { replace: true })
        } else {
          navigate(`/single-decision/${id}`, { replace: true })
        }
      } catch (err) {
        console.error('❌ Fehler beim Redirect:', err.message)
        navigate('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    checkTypeAndRedirect()
  }, [id, token, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 dark:text-gray-300">
        ⏳ Loading decision …
      </div>
    )
  }

  return null
}

export default DecisionRouter
