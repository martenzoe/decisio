import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getGPTRecommendation } from '../ai/decisionAdvisor'
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
      return alert('⚠️ Please fill out all fields.')
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
      console.error('❌ GPT Error:', err.message)
      alert('❌ GPT evaluation failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!token) return alert('⛔ No token found')
    if (!decisionName || options.some(o => !o) || criteria.some(c => !c.name || !c.importance)) {
      return alert('⚠️ Please fill out all fields.')
    }

    setLoading(true)
    try {
      // 1. Create decision
      const res = await fetch('/api/decision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: decisionName, description, mode, type })
      })

      const created = await res.json()
      if (!res.ok) throw new Error(created.error || 'Error creating decision')
      const decisionId = created.id

      // For private decisions: save options, criteria & evaluations
      if (type !== 'team') {
        // 2. Save options & criteria and get IDs
        const detailsRes = await fetch(`/api/decision/${decisionId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: decisionName,
            description,
            mode,
            type,
            options: options.map(o => ({ name: o })),
            criteria: criteria.map(c => ({
              name: c.name,
              importance: Number(c.importance)
            }))
          })
        })
        if (!detailsRes.ok) throw new Error('Could not save options/criteria.')

        // 3. Fetch option and criteria IDs
        const details = await fetch(`/api/decision/${decisionId}/details`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const detailsData = await details.json()
        const { options: optArr, criteria: critArr } = detailsData

        // Map indices to IDs
        const optIdByIdx = Object.fromEntries(optArr.map((o, idx) => [idx, o.id]))
        const critIdByIdx = Object.fromEntries(critArr.map((c, idx) => [idx, c.id]))

        // 4. Save evaluations
        const evalArray = []
        options.forEach((_, optIdx) => {
          criteria.forEach((_, critIdx) => {
            const val = Number(evaluations[optIdx]?.[critIdx])
            const explanation = evaluations[optIdx]?.[`explanation_${critIdx}`] || null
            if (!isNaN(val) && val !== '') {
              evalArray.push({
                option_id: optIdByIdx[optIdx],
                criterion_id: critIdByIdx[critIdx],
                value: val,
                explanation
              })
            }
          })
        })

        if (evalArray.length > 0) {
          const evalRes = await fetch(`/api/decision/${decisionId}/evaluate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ evaluations: evalArray })
          })
          if (!evalRes.ok) throw new Error('Could not save evaluations.')
        }
      }

      navigate(`/decision/${decisionId}`)
    } catch (err) {
      console.error('❌ Save error:', err.message)
      alert(`❌ Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      {loading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 px-6 py-4 rounded shadow text-gray-900 dark:text-white">
            ⏳ Saving decision…
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow space-y-6">
        <h2 className="text-2xl font-bold">➕ New Decision</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            placeholder="Title"
            value={decisionName}
            onChange={e => setDecisionName(e.target.value)}
            className="w-full border px-4 py-2 rounded"
            required
          />
          <textarea
            placeholder="Description…"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full border px-4 py-2 rounded"
            rows="3"
          />

          <div className="grid grid-cols-2 gap-4">
            <select
              value={mode}
              onChange={e => setMode(e.target.value)}
              className="border px-4 py-2 rounded"
            >
              <option value="manual">Manual</option>
              <option value="ai">AI-assisted</option>
            </select>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="border px-4 py-2 rounded"
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </div>

          <div>
            <label className="font-semibold">Options</label>
            {options.map((o, i) => (
              <input
                key={i}
                value={o}
                onChange={e => {
                  const updated = [...options]
                  updated[i] = e.target.value
                  setOptions(updated)
                }}
                className="w-full border px-4 py-2 rounded mb-2"
                required
              />
            ))}
            <button
              type="button"
              onClick={() => {
                const updated = [...options, '']
                setOptions(updated)
                updateEvaluations(updated, criteria)
              }}
              className="text-blue-600 text-sm hover:underline"
            >
              ➕ Add Option
            </button>
          </div>

          <div>
            <label className="font-semibold">Criteria (Importance in %)</label>
            {criteria.map((c, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  value={c.name}
                  onChange={e => {
                    const updated = [...criteria]
                    updated[i].name = e.target.value
                    setCriteria(updated)
                  }}
                  className="flex-1 border px-3 py-2 rounded"
                  required
                />
                <input
                  type="number"
                  value={c.importance}
                  onChange={e => {
                    const updated = [...criteria]
                    updated[i].importance = e.target.value
                    setCriteria(updated)
                  }}
                  className="w-20 border px-3 py-2 rounded"
                  required
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const updated = [...criteria, { name: '', importance: '' }]
                setCriteria(updated)
                updateEvaluations(options, updated)
              }}
              className="text-blue-600 text-sm hover:underline"
            >
              ➕ Add Criterion
            </button>
          </div>

          {mode === 'ai' && !gptFinished && (
            <button
              type="button"
              onClick={handleGPTRecommendation}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              🤖 Start GPT Evaluation
            </button>
          )}

          {(mode === 'manual' || gptFinished) && (
            <>
              <label className="font-semibold">Evaluations (1–10)</label>
              <table className="min-w-full text-sm border mt-2">
                <thead>
                  <tr>
                    <th className="border px-2 py-1 text-left">Option</th>
                    {criteria.map((c, j) => (
                      <th key={j} className="border px-2 py-1 text-left">
                        {c.name}
                      </th>
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
                            onChange={e => {
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

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            💾 Save Decision
          </button>
        </form>
      </div>
    </div>
  )
}

export default NewDecision
