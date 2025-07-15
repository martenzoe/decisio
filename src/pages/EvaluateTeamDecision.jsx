import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../store/useAuthStore'

export default function EvaluateTeamDecision({
  decisionId,
  options,
  criteria,
  existingEvaluations,
  userRole,
  onEvaluationsSaved
}) {
  const { user, token } = useAuthStore()
  const [evaluations, setEvaluations] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Init: Fülle Matrix mit bestehenden Bewertungen (nur für aktuellen User)
  useEffect(() => {
    if (user && existingEvaluations) {
      const userEvals = existingEvaluations.filter(e => String(e.user_id) === String(user.id))
      setEvaluations(userEvals)
    }
  }, [user, existingEvaluations])

  // Bewertung für Option × Kriterium (vom User)
  function getValue(optionId, criterionId) {
    const entry = evaluations.find(e => e.option_id === optionId && e.criterion_id === criterionId)
    return entry ? entry.value : ''
  }

  function setValue(optionId, criterionId, value) {
    setEvaluations(evals => {
      const idx = evals.findIndex(e => e.option_id === optionId && e.criterion_id === criterionId)
      if (idx > -1) {
        // Update
        const copy = [...evals]
        copy[idx] = { ...copy[idx], value }
        return copy
      } else {
        // Insert
        return [...evals, { option_id: optionId, criterion_id: criterionId, value }]
      }
    })
    setSuccess(false)
  }

  // Speichern an Server
  async function saveAll() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/decision/${decisionId}/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          evaluations: evaluations.map(e => ({
            option_id: e.option_id,
            criterion_id: e.criterion_id,
            value: Number(e.value)
          }))
        })
      })
      if (!res.ok) throw new Error('Konnte nicht speichern.')
      setSuccess(true)
      if (onEvaluationsSaved) onEvaluationsSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // --- Rollenlogik ---
  const canEdit = ['owner', 'admin', 'editor'].includes(userRole)
  if (!canEdit) {
    return (
      <div className="text-gray-500 my-8">
        Du hast Leserechte – Bewertung ist für diese Rolle nicht möglich.
      </div>
    )
  }

  // --- Render ---
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow mt-8">
      <h3 className="text-lg font-bold mb-2">Deine Bewertung</h3>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border px-2 py-1">Option</th>
            {criteria.map(c => (
              <th key={c.id} className="border px-2 py-1">{c.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {options.map(o => (
            <tr key={o.id}>
              <td className="border px-2 py-1">{o.name}</td>
              {criteria.map(c => (
                <td key={c.id} className="border px-2 py-1">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="1"
                    disabled={saving}
                    value={getValue(o.id, c.id)}
                    onChange={e => setValue(o.id, c.id, e.target.value)}
                    className="w-16 p-1 border rounded"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-4 items-center mt-4">
        <button
          onClick={saveAll}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          disabled={saving}
        >
          {saving ? 'Speichert...' : 'Bewertung speichern'}
        </button>
        {error && <span className="text-red-500">{error}</span>}
        {success && <span className="text-green-600">Bewertungen gespeichert!</span>}
      </div>
    </div>
  )
}
