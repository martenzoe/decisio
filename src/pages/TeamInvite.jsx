import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { updateDecision } from '../api/decision'

function TeamInvite() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [teamMembers, setTeamMembers] = useState([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('editor')
  const [inviteLink, setInviteLink] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activateSuccess, setActivateSuccess] = useState(null)
  const [activateError, setActivateError] = useState(null)

  const fetchTeamMembers = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/team/team-members/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Laden')
      setTeamMembers(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeamMembers()
  }, [id])

  const handleInvite = async () => {
    setError(null)
    setSuccess(null)
    setInviteLink('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ decision_id: id, email, role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Einladung fehlgeschlagen')
      setSuccess(data.message)
      if (data.token || data.invite_token) {
        setInviteLink(`${window.location.origin}/invite?token=${data.token || data.invite_token}`)
      }
      setEmail('')
      fetchTeamMembers()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleActivateDecision = async () => {
    setActivateError(null)
    setActivateSuccess(null)
    try {
      const token = localStorage.getItem('token')
      await updateDecision(id, token, {
        name: 'Team-Entscheidung',
        description: 'Diese Entscheidung wurde für ein Team erstellt.',
        mode: 'manual',
        type: 'team',
        options: [],
        criteria: [],
        evaluations: [],
      })
      setActivateSuccess('Entscheidung wurde aktiviert.')
      navigate('/dashboard')
    } catch (err) {
      setActivateError('Aktivierung fehlgeschlagen: ' + err.message)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold">Team-Einladung</h2>

      <div className="space-y-2">
        <label className="block font-medium">E-Mail-Adresse</label>
        <input
          type="email"
          className="w-full border rounded p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="block font-medium mt-4">Rolle</label>
        <select
          className="w-full border rounded p-2"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>

        <button
          onClick={handleInvite}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Einladung senden
        </button>

        {success && <p className="text-green-600 mt-2">{success}</p>}
        {error && <p className="text-red-600 mt-2">{error}</p>}
        {inviteLink && (
          <div className="mt-4 p-3 bg-gray-100 dark:bg-neutral-800 rounded">
            <p className="text-sm">🔗 Einladung kopieren:</p>
            <code className="block break-words">{inviteLink}</code>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mt-6 mb-2">Teammitglieder</h3>
        {loading ? (
          <p>⏳ Lädt ...</p>
        ) : (
          <ul className="divide-y">
            {teamMembers.map((m) => (
              <li key={m.id} className="py-2">
                👤 {m.users?.nickname || 'Unbekannt'} – {m.role} {m.accepted ? '✅' : '⏳'}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8">
        <button
          onClick={handleActivateDecision}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Entscheidung aktivieren
        </button>
        {activateSuccess && <p className="text-green-600 mt-2">{activateSuccess}</p>}
        {activateError && <p className="text-red-600 mt-2">{activateError}</p>}
      </div>
    </div>
  )
}

export default TeamInvite
