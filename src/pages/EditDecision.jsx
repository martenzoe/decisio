// src/pages/EditDecision.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

function EditDecision() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [mode, setMode] = useState('manual')
  const [type, setType] = useState('private')

  useEffect(() => {
    const fetchDecision = async () => {
      const res = await fetch(`http://localhost:3000/api/decisions`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      const data = await res.json()
      const decision = data.find(d => d.id === id)
      if (decision) {
        setName(decision.name)
        setDescription(decision.description)
        setMode(decision.mode)
        setType(decision.type)
      }
    }

    fetchDecision()
  }, [id, user.token])

  const handleUpdate = async (e) => {
    e.preventDefault()
    const res = await fetch(`http://localhost:3000/api/decisions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify({ name, description, mode, type }),
    })

    if (res.ok) {
      navigate(`/decision/${id}`)
    } else {
      alert('Fehler beim Aktualisieren')
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4">✏️ Entscheidung bearbeiten</h2>
      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="block font-medium">Titel</label>
          <input
            className="w-full border px-3 py-2 rounded"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-medium">Beschreibung</label>
          <textarea
            className="w-full border px-3 py-2 rounded"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
          />
        </div>
        <div className="flex gap-4">
          <div>
            <label className="block font-medium">Modus</label>
            <select
              className="border px-2 py-1 rounded"
              value={mode}
              onChange={e => setMode(e.target.value)}
            >
              <option value="manual">Manuell</option>
              <option value="ai">KI-gestützt</option>
            </select>
          </div>
          <div>
            <label className="block font-medium">Typ</label>
            <select
              className="border px-2 py-1 rounded"
              value={type}
              onChange={e => setType(e.target.value)}
            >
              <option value="private">Privat</option>
              <option value="public">Öffentlich</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          💾 Entscheidung speichern
        </button>
      </form>
    </div>
  )
}

export default EditDecision
