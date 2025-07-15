import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

// Hilfsfunktionen für Validierung
function hasDuplicates(array) {
  return new Set(array).size !== array.length
}
function isEmptyOrWhitespace(str) {
  return !str || !str.trim()
}

function NewTeamDecision() {
  const [decisionName, setDecisionName] = useState('')
  const [description, setDescription] = useState('')
  const [mode, setMode] = useState('manual')
  const [timer, setTimer] = useState('')
  const [options, setOptions] = useState([''])
  const [criteria, setCriteria] = useState([{ name: '', importance: '' }])
  const [evaluations, setEvaluations] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)

  // Evaluationen initialisieren (immer nach Change von Option/Kriterien)
  useEffect(() => {
    const evals = {}
    options.forEach((_, i) => {
      evals[i] = {}
      criteria.forEach((_, j) => {
        evals[i][j] = ''
      })
    })
    setEvaluations(evals)
  }, [options, criteria])

  useEffect(() => {
    if (!token) navigate('/login')
  }, [token])

  // 2-Step Submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Grundvalidierung
    if (!decisionName || !timer || options.some(o => !o) || criteria.some(c => !c.name || !c.importance)) {
      setError('Bitte alle Felder ausfüllen.')
      return
    }
    // Eindeutigkeit prüfen
    const optionNames = options.map(o => typeof o === 'string' ? o.trim() : o?.name?.trim() || '')
    const criterionNames = criteria.map(c => c.name.trim())
    if (
      optionNames.some(isEmptyOrWhitespace) ||
      criterionNames.some(isEmptyOrWhitespace) ||
      hasDuplicates(optionNames) ||
      hasDuplicates(criterionNames)
    ) {
      setError('Optionen und Kriterien müssen eindeutig und ausgefüllt sein.')
      return
    }

    setLoading(true)

    try {
      // 1. Team-Entscheidung anlegen (ohne Details)
      const basePayload = {
        name: decisionName,
        description,
        mode,
        timer,
        type: 'team'
      }
      const res = await fetch('/api/team-decisions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(basePayload)
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Unbekannter Fehler')
      const { decision } = result
      if (!decision?.id) throw new Error('❌ Keine gültige Decision-ID erhalten')
      const decisionId = decision.id

      // 2. Details als PUT abspeichern
      const evalArray = []
      Object.entries(evaluations).forEach(([optIdx, critObj]) => {
        Object.entries(critObj).forEach(([critIdx, value]) => {
          if (value !== '') {
            evalArray.push({
              option_index: parseInt(optIdx),
              criterion_index: parseInt(critIdx),
              value: Number(value)
              // explanation: kann bei Bedarf ergänzt werden
            })
          }
        })
      })
      const optionsForBackend = options.map((o) =>
        typeof o === 'string' ? { name: o } : o && o.name ? { name: o.name } : { name: '' }
      )
      const putPayload = {
        name: decisionName,
        description,
        mode,
        type: 'team',
        options: optionsForBackend,
        criteria: criteria.map((c) => ({
          name: c.name,
          importance: Number(c.importance)
        })),
        evaluations: evalArray
      }
      // Jetzt Details speichern (PUT)
      const putRes = await fetch(`/api/decision/${decisionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(putPayload)
      })
      const putResult = await putRes.json()
      if (!putRes.ok) throw new Error(putResult.error || 'Fehler beim Speichern der Details')

      // Weiter zu Einladungen
      navigate(`/team-invite/${decisionId}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOptionChange = (idx, value) => {
    const updated = [...options]
    updated[idx] = value
    setOptions(updated)
  }

  const handleCriterionChange = (idx, key, value) => {
    const updated = [...criteria]
    updated[idx][key] = value
    setCriteria(updated)
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-100 shadow-2xl rounded-2xl p-8 space-y-10">
        <h1 className="text-3xl font-bold">Neue Team-Entscheidung</h1>
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input value={decisionName} onChange={(e) => setDecisionName(e.target.value)} placeholder="Titel" className="p-3 border rounded-lg" />
            <input type="datetime-local" value={timer} onChange={(e) => setTimer(e.target.value)} className="p-3 border rounded-lg" />
            <select value={mode} onChange={(e) => setMode(e.target.value)} className="p-3 border rounded-lg">
              <option value="manual">Manuell</option>
              <option value="ai">KI-Modus</option>
            </select>
          </div>

          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Beschreibung" className="w-full p-3 border rounded-lg" rows={3} />

          {/* Optionen */}
          <div>
            <h2 className="text-lg font-semibold">Optionen</h2>
            {options.map((opt, idx) => (
              <div key={idx} className="flex gap-2 mt-2">
                <input value={typeof opt === 'string' ? opt : opt.name || ''} onChange={(e) => handleOptionChange(idx, e.target.value)} placeholder={`Option ${idx + 1}`} className="flex-1 p-2 border rounded" />
                <button type="button" onClick={() => setOptions(options.filter((_, i) => i !== idx))}>X</button>
              </div>
            ))}
            <button type="button" onClick={() => setOptions([...options, ''])} className="mt-2 text-blue-600">+ Option</button>
          </div>

          {/* Kriterien */}
          <div>
            <h2 className="text-lg font-semibold">Kriterien</h2>
            {criteria.map((c, idx) => (
              <div key={idx} className="flex gap-2 mt-2">
                <input value={c.name} onChange={(e) => handleCriterionChange(idx, 'name', e.target.value)} placeholder="Kriterium" className="flex-1 p-2 border rounded" />
                <input type="number" value={c.importance} onChange={(e) => handleCriterionChange(idx, 'importance', e.target.value)} placeholder="Wichtigkeit" className="w-28 p-2 border rounded" />
                <button type="button" onClick={() => setCriteria(criteria.filter((_, i) => i !== idx))}>X</button>
              </div>
            ))}
            <button type="button" onClick={() => setCriteria([...criteria, { name: '', importance: '' }])} className="mt-2 text-blue-600">+ Kriterium</button>
          </div>

          {/* Bewertung */}
          {mode === 'manual' && options.length && criteria.length > 0 && (
            <div className="overflow-x-auto">
              <h2 className="text-lg font-semibold mb-3">Bewertung</h2>
              <table className="min-w-full border">
                <thead>
                  <tr>
                    <th className="p-2 border">Option</th>
                    {criteria.map((c, j) => <th key={j} className="p-2 border">{c.name || `Kriterium ${j + 1}`}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {options.map((o, i) => (
                    <tr key={i}>
                      <td className="p-2 border">{typeof o === 'string' ? o : o.name || ''}</td>
                      {criteria.map((_, j) => (
                        <td key={j} className="p-2 border">
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={evaluations[i]?.[j] || ''}
                            onChange={(e) => handleEvaluationChange(i, j, e.target.value)}
                            className="w-full p-1 border rounded text-center"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {error && (
            <div className="text-red-600 bg-red-50 border border-red-200 p-3 rounded">
              {error}
            </div>
          )}

          <div className="text-right">
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow font-semibold">
              {loading ? 'Speichern …' : 'Weiter zu Einladungen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewTeamDecision
