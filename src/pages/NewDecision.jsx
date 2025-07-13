import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getGPTRecommendation } from '../ai/decisionAdvisor'
import { updateDecision } from '../api/decision'
import { useAuthStore } from '../store/useAuthStore'

function NewDecision() {
  const [decisionName, setDecisionName] = useState('')
  const [description, setDescription] = useState('')
  const [mode, setMode] = useState('manual')
  const [type, setType] = useState('private')
  const [options, setOptions] = useState([''])
  const [criteria, setCriteria] = useState([{ name: '', importance: '' }])
  const [evaluations, setEvaluations] = useState({})
  const [gptFinished, setGptFinished] = useState(false)
  const [loading, setLoading] = useState(false)

  const token = useAuthStore(s => s.token)
  const navigate = useNavigate()

  const updateEvaluations = (opts, crits) => {
    const evals = {}
    opts.forEach((_, i) => {
      evals[i] = {}
      crits.forEach((_, j) => {
        evals[i][j] = ''
        evals[i][`explanation_${j}`] = ''
      })
    })
    setEvaluations(evals)
  }

  const handleGPTRecommendation = async () => {
    if (!decisionName || !description || options.some(o => !o) || criteria.some(c => !c.name || !c.importance)) {
      return alert('⚠️ Bitte alle Felder ausfüllen.')
    }

    setLoading(true)
    try {
      const gptResult = await getGPTRecommendation({ decisionName, description, options, criteria })
      const newEvaluations = {}

      gptResult.forEach(entry => {
        const optIdx = entry.option_index
        if (optIdx === -1 || !options[optIdx]) return

        const row = {}
        entry.bewertungen.forEach(b => {
          const critIdx = b.criterion_index
          if (critIdx === -1 || !criteria[critIdx]) return

          row[critIdx] = Math.round(b.value)
          row[`explanation_${critIdx}`] = b.explanation
        })

        newEvaluations[optIdx] = row
      })

      setEvaluations(newEvaluations)
      setGptFinished(true)
    } catch (err) {
      console.error('❌ GPT Fehler:', err.message)
      alert('❌ GPT-Auswertung fehlgeschlagen.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!token) return alert('⛔ Kein Token gefunden')
    if (!decisionName || options.some(o => !o) || criteria.some(c => !c.name || !c.importance)) {
      return alert('⚠️ Bitte alle Felder ausfüllen.')
    }

    setLoading(true)
    try {
      const res = await fetch('/api/decision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: decisionName, description, mode, type })
      })

      const created = await res.json()
      if (!res.ok) throw new Error(created.error || 'Fehler beim Erstellen')
      const decisionId = created.id

      const evalArray = []
      options.forEach((_, optIdx) => {
        criteria.forEach((_, critIdx) => {
          const val = Number(evaluations[optIdx]?.[critIdx])
          const explanation = evaluations[optIdx]?.[`explanation_${critIdx}`] || null
          if (!isNaN(val)) {
            evalArray.push({
              option_index: optIdx,
              criterion_index: critIdx,
              value: val,
              explanation
            })
          }
        })
      })

      await updateDecision(decisionId, token, {
        name: decisionName,
        description,
        mode,
        type,
        options: options.map(o => ({ name: o })),
        criteria: criteria.map(c => ({
          name: c.name,
          importance: Number(c.importance)
        })),
        evaluations: evalArray
      })

      navigate(`/decision/${decisionId}`)
    } catch (err) {
      console.error('❌ Fehler beim Speichern:', err.message)
      alert(`❌ Fehler: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      {loading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 px-6 py-4 rounded shadow text-gray-900 dark:text-white">
            ⏳ Entscheidung wird gespeichert …
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow space-y-6">
        <h2 className="text-2xl font-bold">➕ Neue Entscheidung</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="text" placeholder="Titel" value={decisionName} onChange={e => setDecisionName(e.target.value)} className="w-full border px-4 py-2 rounded" required />
          <textarea placeholder="Beschreibung…" value={description} onChange={e => setDescription(e.target.value)} className="w-full border px-4 py-2 rounded" rows="3" />

          <div className="grid grid-cols-2 gap-4">
            <select value={mode} onChange={e => setMode(e.target.value)} className="border px-4 py-2 rounded">
              <option value="manual">Manuell</option>
              <option value="ai">KI-gestützt</option>
            </select>
            <select value={type} onChange={e => setType(e.target.value)} className="border px-4 py-2 rounded">
              <option value="private">Privat</option>
              <option value="public">Öffentlich</option>
            </select>
          </div>

          <div>
            <label className="font-semibold">Optionen</label>
            {options.map((o, i) => (
              <input key={i} value={o} onChange={e => {
                const updated = [...options]
                updated[i] = e.target.value
                setOptions(updated)
              }} className="w-full border px-4 py-2 rounded mb-2" required />
            ))}
            <button type="button" onClick={() => {
              const updated = [...options, '']
              setOptions(updated)
              updateEvaluations(updated, criteria)
            }} className="text-blue-600 text-sm hover:underline">➕ Weitere Option</button>
          </div>

          <div>
            <label className="font-semibold">Kriterien (Wichtigkeit in %)</label>
            {criteria.map((c, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input value={c.name} onChange={(e) => {
                  const updated = [...criteria]
                  updated[i].name = e.target.value
                  setCriteria(updated)
                }} className="flex-1 border px-3 py-2 rounded" required />
                <input type="number" value={c.importance} onChange={(e) => {
                  const updated = [...criteria]
                  updated[i].importance = e.target.value
                  setCriteria(updated)
                }} className="w-20 border px-3 py-2 rounded" required />
              </div>
            ))}
            <button type="button" onClick={() => {
              const updated = [...criteria, { name: '', importance: '' }]
              setCriteria(updated)
              updateEvaluations(options, updated)
            }} className="text-blue-600 text-sm hover:underline">➕ Weiteres Kriterium</button>
          </div>

          {mode === 'ai' && !gptFinished && (
            <button type="button" onClick={handleGPTRecommendation} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
              🤖 GPT-Auswertung starten
            </button>
          )}

          {(mode === 'manual' || gptFinished) && (
            <>
              <label className="font-semibold">Bewertungen (1–10)</label>
              <table className="min-w-full text-sm border mt-2">
                <thead>
                  <tr>
                    <th className="border px-2 py-1 text-left">Option</th>
                    {criteria.map((c, j) => (
                      <th key={j} className="border px-2 py-1 text-left">{c.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {options.map((opt, i) => (
                    <tr key={i}>
                      <td className="border px-2 py-1">{opt}</td>
                      {criteria.map((_, j) => (
                        <td key={j} className="border px-2 py-1">
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={evaluations[i]?.[j] || ''}
                            onChange={(e) => {
                              setEvaluations(prev => ({
                                ...prev,
                                [i]: {
                                  ...prev[i],
                                  [j]: e.target.value
                                }
                              }))
                            }}
                            className="w-16 px-2 py-1 border rounded"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            💾 Entscheidung speichern
          </button>
        </form>
      </div>
    </div>
  )
}

export default NewDecision
