// src/pages/TeamInvite.jsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

function TeamInvite() {
  const { id: decision_id } = useParams()
  const token = useAuthStore(state => state.token)

  const [email, setEmail] = useState('')
  const [role, setRole] = useState('viewer')
  const [members, setMembers] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Lade alle Team-Mitglieder
  useEffect(() => {
    async function fetchMembers() {
      try {
        const res = await fetch(`/api/team-members/${decision_id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setMembers(data)
      } catch (err) {
        setError(err.message)
      }
    }

    fetchMembers()
  }, [decision_id, token])

  // Einladung senden
  const handleInvite = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')

    try {
      const res = await fetch('/api/team-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email, role, decision_id })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage('✅ Einladung gesendet')
      setEmail('')
      setRole('viewer')

      // Aktualisiere Liste
      const updated = await fetch(`/api/team-members/${decision_id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const updatedData = await updated.json()
      setMembers(updatedData)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Team-Mitglieder einladen</h2>

      <form onSubmit={handleInvite} className="space-y-4">
        <input
          type="email"
          placeholder="E-Mail-Adresse"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full border rounded px-3 py-2"
        />
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="viewer">Viewer</option>
          <option value="editor">Editor</option>
          <option value="owner">Owner</option>
        </select>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Einladung senden
        </button>
      </form>

      {message && <p className="mt-4 text-green-600">{message}</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}

      <h3 className="text-xl font-semibold mt-6 mb-2">Aktuelle Mitglieder</h3>
      <ul className="space-y-2">
        {members.map(member => (
          <li key={member.id} className="border p-3 rounded bg-gray-50">
            <p><strong>{member.nickname}</strong> ({member.email})</p>
            <p>Rolle: {member.role}</p>
            <p>Status: {member.accepted ? '✅ Akzeptiert' : '⏳ Offen'}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TeamInvite
