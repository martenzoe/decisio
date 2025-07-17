import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'

export default function TeamCriterionWeighting({ decisionId, criteria, userRole, onWeightsSaved }) {
  const { user, token } = useAuthStore()
  const [weights, setWeights] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Nur eigene Gewichtungen laden
  useEffect(() => {
    if (!user || !decisionId || !token) return
    setError(null)
    fetch(`/api/decision/${decisionId}/weights`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(json => {
        setWeights(Array.isArray(json.weights) ? json.weights : [])
      })
      .catch(err => setError(err.message))
  }, [user, decisionId, token, success]) // success triggert Refresh nach Speichern

  function getWeight(criterionId) {
    const entry = weights.find(w => w.criterion_id === criterionId)
    return entry ? entry.weight : ''
  }

  function setWeight(criterionId, value) {
    setWeights(ws => {
      const idx = ws.findIndex(w => w.criterion_id === criterionId)
      const cleanValue = value === '' ? '' : Math.max(0, Math.min(100, Number(value)))
      if (idx > -1) {
        const copy = [...ws]
        copy[idx] = { ...copy[idx], weight: cleanValue }
        return copy
      } else {
        return [...ws, { criterion_id: criterionId, weight: cleanValue }]
      }
    })
    setSuccess(false)
  }

  async function saveAll() {
    setSaving(true)
    setError(null)
    try {
      const body = {
        weights: criteria.map(c => ({
          criterion_id: c.id,
          weight: Number(getWeight(c.id)) || 0
        }))
      }
      const res = await fetch(`/api/decision/${decisionId}/weights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error('Konnte nicht speichern.')
      setSuccess(true)
      if (onWeightsSaved) onWeightsSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // NEU: Jeder außer Viewer kann hier gewichten!
  const canEdit = userRole !== 'viewer'
  if (!canEdit) return null

  if (!criteria.length) {
    return (
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow mt-8 text-gray-500 text-center">
        Noch keine Kriterien vorhanden. Sobald Kriterien definiert sind, kannst du hier deine Gewichtung abgeben.
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow mt-8">
      <h3 className="text-lg font-bold mb-2">
        Deine Gewichtung der Kriterien <span className="text-sm text-gray-400">(optional)</span>
      </h3>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border px-2 py-1">Kriterium</th>
            <th className="border px-2 py-1">Wichtigkeit (0-100)</th>
          </tr>
        </thead>
        <tbody>
          {criteria.map((c, idx) => (
            <tr key={c.id ? `crit-${c.id}` : `crit-${c.name}-${idx}`}>
              <td className="border px-2 py-1">{c.name}</td>
              <td className="border px-2 py-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  disabled={saving}
                  value={getWeight(c.id)}
                  onChange={e => setWeight(c.id, e.target.value)}
                  className="w-20 p-1 border rounded"
                  inputMode="numeric"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-4 items-center mt-4">
        <button
          onClick={saveAll}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          disabled={saving || !criteria.length}
        >
          {saving ? 'Speichert...' : 'Gewichtung speichern'}
        </button>
        {error && <span className="text-red-500">{error}</span>}
        {success && <span className="text-green-600">Gespeichert!</span>}
      </div>
    </div>
  )
}
