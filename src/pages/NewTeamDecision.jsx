// src/pages/NewTeamDecision.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function NewTeamDecision() {
  const [decisionName, setDecisionName] = useState('')
  const [description, setDescription] = useState('')
  const [mode, setMode] = useState('manual')
  const [timer, setTimer] = useState('')
  const [options, setOptions] = useState([''])
  const [criteria, setCriteria] = useState([{ name: '', importance: '' }])
  const [evaluations, setEvaluations] = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const updateEvaluations = (opts, crits) => {
    const evals = {}
    opts.forEach((_, i) => {
      evals[i] = {}
      crits.forEach((_, j) => {
        evals[i][j] = ''
      })
    })
    setEvaluations(evals)
  }

  const handleOptionChange = (idx, value) => {
    const updated = [...options]
    updated[idx] = value
    setOptions(updated)
    updateEvaluations(updated, criteria)
  }

  const handleCriterionChange = (idx, key, value) => {
    const updated = [...criteria]
    updated[idx][key] = value
    setCriteria(updated)
    updateEvaluations(options, updated)
  }

  const handleEvaluationChange = (optIdx, critIdx, value) => {
    setEvaluations((prev) => ({
      ...prev,
      [optIdx]: {
        ...prev[optIdx],
        [critIdx]: value
      }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) return alert('⛔ Kein Token gefunden')

    if (!decisionName || !timer || options.some(o => !o) || criteria.some(c => !c.name || !c.importance)) {
      return alert('⚠️ Bitte alle Felder ausfüllen')
    }

    setLoading(true)
    try {
      const res = await fetch('/api/team-decisions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: decisionName,
          description,
          mode,
          timer,
          type: 'team'
        })
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Unbekannter Fehler')

      const { decision } = result
      if (!decision?.id) throw new Error('❌ Keine gültige Decision-ID erhalten')

      // ✅ Gehe zur Invite-Seite mit der ID
      navigate(`/team-invite/${decision.id}`)
    } catch (err) {
      console.error('❌ Fehler beim Erstellen:', err.message)
      alert(`❌ ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-100 shadow-2xl rounded-2xl p-8 space-y-10">
        <h1 className="text-3xl font-bold">Neue Team-Entscheidung</h1>
        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Allgemeine Infos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              value={decisionName}
              onChange={(e) => setDecisionName(e.target.value)}
              placeholder="Titel der Entscheidung"
              className="p-3 border rounded-lg shadow-sm w-full bg-white dark:bg-neutral-700 dark:border-neutral-600"
            />
            <input
              type="datetime-local"
              value={timer}
              onChange={(e) => setTimer(e.target.value)}
              className="p-3 border rounded-lg shadow-sm w-full bg-white dark:bg-neutral-700 dark:border-neutral-600"
            />
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="p-3 border rounded-lg shadow-sm w-full bg-white dark:bg-neutral-700 dark:border-neutral-600"
            >
              <option value="manual">Manuell</option>
              <option value="ai">KI-Modus</option>
            </select>
          </div>

          {/* Beschreibung */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beschreibung der Entscheidung"
            className="w-full p-3 border rounded-lg shadow-sm bg-white dark:bg-neutral-700 dark:border-neutral-600"
            rows={4}
          />

          {/* Optionen */}
          <div className="bg-neutral-100 dark:bg-neutral-700 p-4 rounded-xl shadow-inner">
            <h2 className="text-lg font-semibold mb-3">Optionen</h2>
            {options.map((opt, idx) => (
              <div key={idx} className="flex gap-2 items-center mb-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  className="flex-1 p-2 border rounded bg-white dark:bg-neutral-800 dark:border-neutral-600"
                />
                <button
                  type="button"
                  onClick={() => {
                    const updated = options.filter((_, i) => i !== idx)
                    setOptions(updated)
                    updateEvaluations(updated, criteria)
                  }}
                  className="text-red-500 font-bold"
                >
                  X
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setOptions([...options, ''])}
              className="mt-2 text-blue-600 dark:text-blue-400 font-medium"
            >
              + Option hinzufügen
            </button>
          </div>

          {/* Kriterien */}
          <div className="bg-neutral-100 dark:bg-neutral-700 p-4 rounded-xl shadow-inner">
            <h2 className="text-lg font-semibold mb-3">Kriterien</h2>
            {criteria.map((crit, idx) => (
              <div key={idx} className="flex gap-2 items-center mb-2">
                <input
                  type="text"
                  value={crit.name}
                  onChange={(e) => handleCriterionChange(idx, 'name', e.target.value)}
                  placeholder="Kriterium"
                  className="flex-1 p-2 border rounded bg-white dark:bg-neutral-800 dark:border-neutral-600"
                />
                <input
                  type="number"
                  value={crit.importance}
                  onChange={(e) => handleCriterionChange(idx, 'importance', e.target.value)}
                  placeholder="Wichtigkeit (1–10)"
                  className="w-32 p-2 border rounded bg-white dark:bg-neutral-800 dark:border-neutral-600"
                />
                <button
                  type="button"
                  onClick={() => {
                    const updated = criteria.filter((_, i) => i !== idx)
                    setCriteria(updated)
                    updateEvaluations(options, updated)
                  }}
                  className="text-red-500 font-bold"
                >
                  X
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setCriteria([...criteria, { name: '', importance: '' }])}
              className="mt-2 text-blue-600 dark:text-blue-400 font-medium"
            >
              + Kriterium hinzufügen
            </button>
          </div>

          {/* Bewertungsmatrix */}
          {mode === 'manual' && criteria.length > 0 && options.length > 0 && (
            <div className="overflow-x-auto">
              <h2 className="text-lg font-semibold mb-3">Bewertung: Wie stark erfüllt jede Option das Kriterium?</h2>
              <table className="min-w-full border border-neutral-300 dark:border-neutral-600 text-sm">
                <thead className="bg-neutral-200 dark:bg-neutral-600 text-gray-800 dark:text-gray-100">
                  <tr>
                    <th className="p-2 border dark:border-neutral-500">Option</th>
                    {criteria.map((c, j) => (
                      <th key={j} className="p-2 border dark:border-neutral-500">{c.name || `Kriterium ${j + 1}`}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {options.map((opt, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-neutral-800' : 'bg-neutral-50 dark:bg-neutral-700'}>
                      <td className="p-2 border font-medium dark:border-neutral-600">{opt || `Option ${i + 1}`}</td>
                      {criteria.map((_, j) => (
                        <td key={j} className="p-2 border dark:border-neutral-600">
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={evaluations[i]?.[j] || ''}
                            onChange={(e) => handleEvaluationChange(i, j, e.target.value)}
                            className="w-full p-1 border rounded text-center bg-white dark:bg-neutral-800 dark:border-neutral-600"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Submit */}
          <div className="text-right">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-2 rounded-lg shadow font-semibold transition"
            >
              {loading ? 'Speichern …' : 'Weiter zu Einladungen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewTeamDecision
