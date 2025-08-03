import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

console.log('📣 Invite-Komponente geladen')

function Invite() {
  const navigate = useNavigate()
  const { search } = useLocation()
  const token = new URLSearchParams(search).get('token')

  const user = useAuthStore((state) => state.user)
  const jwt = useAuthStore((state) => state.token)

  const [status, setStatus] = useState('loading')
  const [info, setInfo] = useState(null)

  console.log('🔍 URL Token:', token)
  console.log('👤 Aktueller User:', user)
  console.log('🔐 Aktuelles JWT:', jwt)

  // 📌 Token validieren
  useEffect(() => {
    if (!token) {
      console.warn('⚠️ Kein Token in der URL gefunden')
      setStatus('error')
      return
    }
    validateToken()
  }, [token])

  // ✅ Einladung annehmen – wenn alles geladen ist
  useEffect(() => {
    if (!token) return
    if (status === 'ready' && user && jwt) {
      console.log('🚀 acceptInvite wird ausgelöst')
      acceptInvite()
    }
  }, [status, user, jwt, token])

  const validateToken = async () => {
    try {
      console.log('🔍 Validierung startet für Token:', token)
      const res = await fetch(`/api/team/validate/${token}`)
      const data = await res.json()

      console.log('✅ Server-Antwort:', data)
      if (!res.ok) throw new Error(data.error)

      setInfo(data)
      setStatus('ready')

      localStorage.setItem('pendingInviteToken', token)
      console.log('💾 Token lokal gespeichert')
    } catch (err) {
      console.error('❌ Fehler bei validateToken:', err.message)
      setStatus('error')
    }
  }

  const acceptInvite = async () => {
    try {
      const invite_token = token || localStorage.getItem('pendingInviteToken')
      if (!invite_token) {
        console.warn('⚠️ Kein gültiger Invite-Token gefunden')
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
      console.log('📦 Antwort vom Server nach Annahme:', result)
      if (!res.ok) throw new Error(result.error)

      localStorage.removeItem('pendingInviteToken')
      console.log('🧹 Token aus LocalStorage entfernt')

      const decisionId = info?.decision_id || result?.decision_id
      console.log('➡️ Weiterleitung zu:', decisionId)

      navigate(decisionId ? `/decision/${decisionId}` : '/dashboard')
    } catch (err) {
      console.error('❌ Fehler beim Annehmen:', err.message)
      setStatus('error')
    }
  }

  // UI States
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-white">
        <p className="text-xl">⏳ Checking invitation …</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-600">
        <p className="text-xl">❌ Invalid or expired invitation link.</p>
      </div>
    )
  }

  if (status === 'ready' && (!user || !jwt)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white">
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8 max-w-md w-full space-y-4 text-center">
          <h2 className="text-2xl font-bold">Invitation to Decisia</h2>
          <p>You have been invited to the decision.</p>
          <p>Role: <strong>{info?.role || 'Member'}</strong></p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Please log in or register to join.
          </p>
          <div className="flex justify-center gap-4 mt-6">
            <a
              href="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
            >
              Log In
            </a>
            <a
              href="/register"
              className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded transition"
            >
              Register
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'ready' && user && jwt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-white">
        <p className="text-xl">✅ Invitation accepted. Redirecting …</p>
      </div>
    )
  }

  return null
}

export default Invite
