import { useState } from 'react'
import { useParams } from 'react-router-dom'

export default function TeamInvite() {
  const { id } = useParams()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('editor')
  const [message, setMessage] = useState('')
  const token = localStorage.getItem('token')

  const handleInvite = async (e) => {
    e.preventDefault()

    const res = await fetch('/api/team/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        decisionId: id,
        email,
        role
      })
    })

    const data = await res.json()

    if (res.ok) {
      setMessage('✅ Einladung versendet')
      setEmail('')
    } else {
      setMessage(`❌ ${data.error || 'Fehler beim Einladen'}`)
    }
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h2 className="text-2xl font-bold mb-4">👥 Nutzer einladen</h2>
      <form onSubmit={handleInvite} className="space-y-4">
        <input
          type="email"
          placeholder="E-Mail-Adresse"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="editor">Bearbeiter</option>
          <option value="viewer">Beobachter</option>
        </select>
        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
          Einladung senden
        </button>
      </form>
      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  )
}
