// src/pages/DecisionRouter.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

function DecisionRouter() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  const { token } = useAuthStore()

  useEffect(() => {
    const checkTypeAndRedirect = async () => {
      if (!token) {
        console.warn('⚠️ Kein Token vorhanden – redirect zum Login')
        navigate('/login')
        return
      }

      try {
        const res = await fetch(`/api/decision/${id}/type`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        const data = await res.json()
        console.log('📦 Entscheidung geladen:', data)

        if (!res.ok) throw new Error(data.error)

        const isTeam = data.is_team
        navigate(isTeam ? `/team-decision/${id}` : `/decision/${id}`, { replace: true })
      } catch (err) {
        console.error('❌ Entscheidung konnte nicht geladen werden:', err.message)
        navigate('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    checkTypeAndRedirect()
  }, [id, token, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300">
        ⏳ Entscheidung wird geladen …
      </div>
    )
  }

  return null
}

export default DecisionRouter
