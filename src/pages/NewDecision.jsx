import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function NewDecision() {
  const [decisionName, setDecisionName] = useState('')
  const [description, setDescription] = useState('')
  const [mode, setMode] = useState('manual')
  const [type, setType] = useState('private')
  const [options, setOptions] = useState([''])
  const [criteria, setCriteria] = useState([{ name: '', importance: '' }])
  const [evaluations, setEvaluations] = useState({})
  const navigate = useNavigate()

  const updateEvaluations = (opts, crits) => {
    const newEval = {}
    opts.forEach((_, optIdx) => {
      newEval[optIdx] = {}
      crits.forEach((_, critIdx) => {
        newEval[optIdx][critIdx] = ''
      })
    })
    setEvaluations(newEval)
  }

  const handleAddOption = () => {
    const newOptions = [...options, '']
    setOptions(newOptions)
    updateEvaluations(newOptions, criteria)
  }

  const handleAddCriterion = () => {
    const newCriteria = [...criteria, { name: '', importance: '' }]
    setCriteria(newCriteria)
    updateEvaluations(options, newCriteria)
  }

  const handleEvaluationChange = (optIdx, critIdx, value) => {
    setEvaluations(prev => ({
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

    try {
      // Entscheidung speichern
      const res = await fetch('http://localhost:3000/api/decision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: decisionName, description, mode, type })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler bei Entscheidung')

      const decisionId = data.id

      // Optionen speichern
      const resOpt = await fetch(`http://localhost:3000/api/decision/${decisionId}/options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ options })
      })
      const dataOpt = await resOpt.json()
      if (!resOpt.ok) throw new Error(dataOpt.error || 'Fehler bei Optionen')

      // Kriterien vorbereiten (Zahlen sicherstellen!)
      const formattedCriteria = criteria.map(c => ({
        name: c.name,
        importance: Number(c.importance)
      }))

      // Kriterien speichern
      const resCrit = await fetch(`http://localhost:3000/api/decision/${decisionId}/criteria`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ criteria: formattedCriteria })
      })
      const dataCrit = await resCrit.json()
      if (!resCrit.ok) throw new Error(dataCrit.error || 'Fehler bei Kriterien')

      // Bewertungen vorbereiten
      const evaluationsArray = []
      options.forEach((_, optIdx) => {
        criteria.forEach((_, critIdx) => {
          const value = Number(evaluations[optIdx]?.[critIdx])
          if (!isNaN(value)) {
            evaluationsArray.push({
              option_index: optIdx,
              criterion_index: critIdx,
              value
            })
          }
        })
      })

      // Bewertungen speichern
      const resEval = await fetch(`http://localhost:3000/api/decision/${decisionId}/evaluations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          evaluations: evaluationsArray,
          options,
          criteria: formattedCriteria
        })
      })
      const dataEval = await resEval.json()
      if (!resEval.ok) throw new Error(dataEval.error || 'Fehler bei Bewertungen')

      // Weiterleitung
      navigate(`/decision/${decisionId}`)

    } catch (err) {
      console.error('❌ Fehler beim Speichern:', err.message)
      alert(`❌ Fehler beim Speichern: ${err.message}`)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto py-10">
      <h2 className="text-2xl font-bold">➕ Neue Entscheidung erstellen</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Titel"
          value={decisionName}
          onChange={e => setDecisionName(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          required
        />
        <textarea
          placeholder="Beschreibung"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          rows="3"
        />

        <select value={mode} onChange={e => setMode(e.target.value)} className="w-full border px-3 py-2 rounded">
          <option value="manual">Manuell</option>
          <option value="ai">KI</option>
        </select>

        <select value={type} onChange={e => setType(e.target.value)} className="w-full border px-3 py-2 rounded">
          <option value="private">Privat</option>
          <option value="public">Öffentlich</option>
        </select>

        <div>
          <label className="font-semibold">Optionen</label>
          {options.map((opt, i) => (
            <input
              key={i}
              type="text"
              value={opt}
              onChange={(e) => {
                const newOptions = [...options]
                newOptions[i] = e.target.value
                setOptions(newOptions)
                updateEvaluations(newOptions, criteria)
              }}
              className="w-full border px-3 py-2 rounded mb-2"
              required
            />
          ))}
          <button type="button" onClick={handleAddOption} className="text-blue-600 underline">
            ➕ Weitere Option
          </button>
        </div>

        <div>
          <label className="font-semibold">Kriterien (mit Gewichtung %)</label>
          {criteria.map((crit, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                type="text"
                value={crit.name}
                onChange={e => {
                  const newCrit = [...criteria]
                  newCrit[i].name = e.target.value
                  setCriteria(newCrit)
                  updateEvaluations(options, newCrit)
                }}
                className="flex-1 border px-3 py-2 rounded"
                required
              />
              <input
                type="number"
                value={crit.importance}
                onChange={e => {
                  const newCrit = [...criteria]
                  newCrit[i].importance = e.target.value
                  setCriteria(newCrit)
                }}
                className="w-20 border px-3 py-2 rounded"
                required
              />
            </div>
          ))}
          <button type="button" onClick={handleAddCriterion} className="text-blue-600 underline">
            ➕ Weiteres Kriterium
          </button>
        </div>

        <div>
          <label className="font-semibold">Bewertungen (1–10 je Option × Kriterium)</label>
          <table className="min-w-full border mt-2">
            <thead>
              <tr>
                <th className="border p-2">Option</th>
                {criteria.map((c, ci) => (
                  <th key={ci} className="border p-2">{c.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {options.map((opt, oi) => (
                <tr key={oi}>
                  <td className="border p-2 font-semibold">{opt}</td>
                  {criteria.map((_, ci) => (
                    <td key={ci} className="border p-2">
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={evaluations[oi]?.[ci] || ''}
                        onChange={(e) => handleEvaluationChange(oi, ci, e.target.value)}
                        className="w-16 px-2 py-1 border rounded"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Entscheidung speichern
        </button>
      </form>
    </div>
  )
}

export default NewDecision
