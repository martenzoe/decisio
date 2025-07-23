import React from 'react'

export default function EvaluateTeamDecision({
  options,
  criteria,
  evaluations,
  setEvaluations,
  userRole,
  disabled
}) {
  // Nur Edit, wenn Rolle passt
  const canEdit = userRole !== 'viewer'
  if (!canEdit) {
    return (
      <div className="text-gray-500 my-8">
        Du hast Leserechte – Bewertung ist für diese Rolle nicht möglich.
      </div>
    )
  }

  function getValue(optionId, criterionId) {
    const entry = evaluations.find(e => e.option_id === optionId && e.criterion_id === criterionId)
    return entry ? entry.value : ''
  }

  function setValue(optionId, criterionId, value) {
    setEvaluations(evals => {
      const idx = evals.findIndex(e => e.option_id === optionId && e.criterion_id === criterionId)
      if (idx > -1) {
        const copy = [...evals]
        copy[idx] = { ...copy[idx], value }
        return copy
      } else {
        return [...evals, { option_id: optionId, criterion_id: criterionId, value }]
      }
    })
  }

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow mt-8">
      <h3 className="text-lg font-bold mb-2">Deine Bewertung</h3>
      {disabled && (
        <div className="mb-4 p-2 bg-red-100 text-red-800 rounded text-sm font-bold text-center">
          Deadline abgelaufen. Voting nicht mehr möglich.
        </div>
      )}
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border px-2 py-1">Option</th>
            {criteria.map((c, idx) => (
              <th key={c.id || `${c.name}-${idx}`} className="border px-2 py-1">
                {c.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {options.map((o, optIdx) => (
            <tr key={o.id || `${o.name}-${optIdx}`}>
              <td className="border px-2 py-1">{o.name}</td>
              {criteria.map((c, critIdx) => (
                <td key={c.id || `${c.name}-${critIdx}`} className="border px-2 py-1">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="1"
                    disabled={disabled}
                    value={getValue(o.id, c.id)}
                    onChange={e => setValue(o.id, c.id, e.target.value)}
                    className={`w-16 p-1 border rounded ${disabled ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : ''}`}
                    aria-label={`Bewertung für ${o.name} nach ${c.name}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {/* Optional: Button ausgrauen, falls du ihn hier drin hast */}
      {/* 
      <div className="mt-4 text-right">
        <button
          className="bg-indigo-600 text-white px-6 py-2 rounded font-semibold"
          disabled={disabled}
        >
          {disabled ? 'Voting gesperrt' : 'Abstimmen'}
        </button>
      </div>
      */}
    </div>
  )
}
