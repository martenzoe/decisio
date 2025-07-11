// src/pages/DecisionRouter.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

function DecisionRouter() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkTypeAndRedirect = async () => {
      try {
        const token = localStorage.getItem('token')
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
  }, [id, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300">
        <p>⏳ Entscheidung wird geladen …</p>
      </div>
    )
  }

  return null
}

export default DecisionRouter
