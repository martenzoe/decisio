import React from 'react'

export default function TeamCriterionWeighting({
  criteria,
  weights,
  setWeights,
  userRole,
  disabled
}) {
  // Jeder außer Viewer kann editieren
  const canEdit = userRole !== 'viewer'
  if (!canEdit) return null

  if (!criteria.length) {
    return (
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow mt-8 text-gray-500 text-center">
        No criteria defined yet. Once criteria are defined, you can specify your weighting here.
      </div>
    )
  }

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
  }

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow mt-8">
      <h3 className="text-lg font-bold mb-2">
        Your weighting of the criteria <span className="text-sm text-gray-400">(optional)</span>
      </h3>
      {disabled && (
        <div className="mb-4 p-2 bg-red-100 text-red-800 rounded text-sm font-bold text-center">
          Deadline expired, weighting no longer possible.
        </div>
      )}
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border px-2 py-1">Criterion</th>
            <th className="border px-2 py-1">Importance (0-100)</th>
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
                  disabled={disabled}
                  value={getWeight(c.id)}
                  onChange={e => setWeight(c.id, e.target.value)}
                  className={`w-20 p-1 border rounded ${disabled ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : ''}`}
                  inputMode="numeric"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
