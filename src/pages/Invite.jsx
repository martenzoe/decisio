import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

function Invite() {
  const navigate = useNavigate()
  const { search } = useLocation()
  const token = new URLSearchParams(search).get('token')

  const user = useAuthStore((state) => state.user)
  const jwt = useAuthStore((state) => state.token)

  const [status, setStatus] = useState('loading')
  const [info, setInfo] = useState(null)

  // 🔍 Token validieren
  useEffect(() => {
    if (!token) {
      setStatus('error')
      return
    }
    validateToken()
  }, [token])

  // 🔐 Einladung annehmen
  useEffect(() => {
    if (status === 'ready' && user && jwt && info?.type === 'db') {
      acceptInvite()
    }
  }, [status, user, jwt, info])

  const validateToken = async () => {
    try {
      const res = await fetch(`/api/team/validate/${token}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setInfo(data)
      setStatus('ready')

      // 🎯 Token in localStorage sichern (auch bei JWT)
      localStorage.setItem('pendingInviteToken', token)
    } catch (err) {
      console.error('❌ Validierung fehlgeschlagen:', err.message)
      setStatus('error')
    }
  }

  const acceptInvite = async () => {
    try {
      const invite_token = token || localStorage.getItem('pendingInviteToken')
      if (!invite_token) {
        setStatus('error')
        return
      }

      const res = await fetch('/api/team/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ invite_token }),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

      localStorage.removeItem('pendingInviteToken')

      const decisionId = info?.decision_id || result?.decision_id
      if (decisionId) {
        navigate(`/decision/${decisionId}`)
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      console.error('❌ Fehler beim Annehmen:', err.message)
      setStatus('error')
    }
  }

  // 🧭 UI States
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-white">
        <p className="text-xl">⏳ Einladung wird geprüft …</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-600">
        <p className="text-xl">❌ Ungültiger oder abgelaufener Einladungslink.</p>
      </div>
    )
  }

  if (status === 'ready' && (!user || !jwt)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white">
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8 max-w-md w-full space-y-4 text-center">
          <h2 className="text-2xl font-bold">Einladung zu Decisia</h2>
          <p>Du wurdest zur Entscheidung eingeladen.</p>
          <p>Rolle: <strong>{info?.role || 'Mitglied'}</strong></p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Bitte melde dich an oder registriere dich, um beizutreten.
          </p>
          <div className="flex justify-center gap-4 mt-6">
            <a
              href="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
            >
              Anmelden
            </a>
            <a
              href="/register"
              className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded transition"
            >
              Registrieren
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'ready' && user && jwt && info?.type === 'db') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-white">
        <p className="text-xl">✅ Einladung angenommen. Weiterleitung …</p>
      </div>
    )
  }

  return null
}

export default Invite
