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
        Noch keine Kriterien vorhanden. Sobald Kriterien definiert sind, kannst du hier deine Gewichtung abgeben.
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
                  disabled={disabled}
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
    </div>
  )
}
