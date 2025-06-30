import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

export default function NewTeamDecision() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [mode, setMode] = useState('manual')
  const [timer, setTimer] = useState('')
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')

    const res = await fetch('/api/team/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name, description, mode, timer })
    })

    const data = await res.json()

    if (res.ok) {
      navigate(`/team-invite/${data.decision.id}`)
    } else {
      alert(data.error || 'Fehler beim Erstellen')
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h2 className="text-2xl font-bold mb-4">➕ Neue Team-Entscheidung</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Titel"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />
        <textarea
          placeholder="Beschreibung"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <select
          value={mode}
          onChange={e => setMode(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="manual">🧠 Manuell</option>
          <option value="ai">🤖 KI</option>
        </select>
        <input
          type="datetime-local"
          value={timer}
          onChange={e => setTimer(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
          Entscheidung anlegen
        </button>
      </form>
    </div>
  )
}
