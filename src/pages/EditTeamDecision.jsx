import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import EvaluateTeamDecision from './EvaluateTeamDecision'

export default function EditTeamDecision() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, token } = useAuthStore()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  // Optional: Optionen und Kriterien editierbar machen für Admin/Owner
  // const [options, setOptions] = useState([])
  // const [criteria, setCriteria] = useState([])

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/decision/${id}/details`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const json = await res.json()
        if (!res.ok || !json.decision) throw new Error(json.error || 'Fehler beim Laden')
        setData(json)
        setName(json.decision.name)
        setDescription(json.decision.description)
        // setOptions(json.options)
        // setCriteria(json.criteria)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    if (user && id && token) fetchData()
  }, [user, id, token])

  if (loading) return <div className="p-8">⏳ Lädt...</div>
  if (error) return <div className="text-red-500 p-8">{error}</div>
  if (!data) return null

  const { decision, options = [], criteria = [], evaluations = [], userRole } = data

  // --- Rollenlogik ---
  if (userRole === 'viewer') {
    // Viewer: keine Bearbeitung, keine Bewertung
    return (
      <div className="max-w-xl mx-auto mt-12 text-gray-400 font-bold text-center">
        Du hast nur Leserechte für diese Team-Entscheidung.<br />
        Bearbeitung oder Bewertung ist nicht möglich.<br /><br />
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => navigate(`/team-decision/${id}`)}
        >
          Zurück zur Übersicht
        </button>
      </div>
    )
  }

  // --- Editor/Admin/Owner ---
  const canEditMeta = userRole === 'admin' || userRole === 'owner'
  // const canEditOptionsCriteria = userRole === 'admin' || userRole === 'owner'

  // --- Save Meta (Name/Beschreibung) ---
  async function handleMetaSave(e) {
    e.preventDefault()
    try {
      const res = await fetch(`/api/decision/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          description,
          mode: decision.mode,
          type: decision.type,
          options: options.map(o => ({ id: o.id, name: o.name })),
          criteria: criteria.map(c => ({
            id: c.id,
            name: c.name,
            importance: c.importance
          })),
          // WICHTIG: Bewertungen werden in separater Komponente gespeichert
          evaluations: []
        })
      })
      if (!res.ok) throw new Error('Fehler beim Speichern')
      alert('Gespeichert')
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <h2 className="text-2xl font-bold mb-4">✏️ Team-Entscheidung bearbeiten</h2>
      {/* Meta bearbeiten (Admin/Owner) */}
      <form className="mb-6" onSubmit={handleMetaSave}>
        <div className="mb-2 text-gray-500">Titel</div>
        <input
          type="text"
          className="w-full p-2 border rounded"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={!canEditMeta}
        />
        <div className="mb-2 mt-4 text-gray-500">Beschreibung</div>
        <textarea
          className="w-full p-2 border rounded"
          rows={3}
          value={description}
          onChange={e => setDescription(e.target.value)}
          disabled={!canEditMeta}
        />
        {canEditMeta && (
          <button
            type="submit"
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            💾 Speichern
          </button>
        )}
      </form>

      {/* Bewertung: Admin, Owner, Editor */}
      <EvaluateTeamDecision
        decisionId={decision.id}
        options={options}
        criteria={criteria}
        existingEvaluations={evaluations}
        userRole={userRole}
        onEvaluationsSaved={() => {
          // Optional: Neu laden
        }}
      />
    </div>
  )
}
