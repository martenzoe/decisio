// src/pages/NewDecision.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getGPTRecommendation } from '../ai/decisionAdvisor'

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
  const navigate = useNavigate()

  const updateEvaluations = (opts, crits) => {
    const newEval = {}
    opts.forEach((_, optIdx) => {
      newEval[optIdx] = {}
      crits.forEach((_, critIdx) => {
        newEval[optIdx][critIdx] = ''
        newEval[optIdx][`explanation_${critIdx}`] = ''
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

  const handleGPTRecommendation = async () => {
    if (!decisionName || !description || options.some(o => !o) || criteria.some(c => !c.name || !c.importance)) {
      return alert('⚠️ Please fill in all fields.')
    }

    setLoading(true)
    try {
      const gptResult = await getGPTRecommendation({ decisionName, description, options, criteria })
      const newEvaluations = {}

      gptResult.forEach((optionResult, optIdx) => {
        const row = {}
        criteria.forEach((crit, critIdx) => {
          const match = optionResult.bewertungen.find(b => b.kriterium === crit.name)
          row[critIdx] = match ? Math.round(match.score) : 0
          row[`explanation_${critIdx}`] = match?.begründung || ''
        })
        newEvaluations[optIdx] = row
      })

      setEvaluations(newEvaluations)
      setGptFinished(true)
      alert('✅ GPT recommendations applied.')
    } catch (err) {
      console.error('❌ GPT error:', err.message)
      alert('❌ GPT evaluation failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) return alert('⛔ Token not found')

    setLoading(true)

    try {
      const res = await fetch('http://localhost:3000/api/decision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: decisionName, description, mode, type })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save decision')

      const decisionId = data.id

      const resOpt = await fetch(`http://localhost:3000/api/decision/${decisionId}/options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ options })
      })
      const dataOpt = await resOpt.json()
      if (!resOpt.ok) throw new Error(dataOpt.error || 'Failed to save options')

      const formattedCriteria = criteria.map(c => ({
        name: c.name,
        importance: Number(c.importance)
      }))

      const resCrit = await fetch(`http://localhost:3000/api/decision/${decisionId}/criteria`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ criteria: formattedCriteria })
      })
      const dataCrit = await resCrit.json()
      if (!resCrit.ok) throw new Error(dataCrit.error || 'Failed to save criteria')

      const evaluationsArray = []
      options.forEach((_, optIdx) => {
        criteria.forEach((_, critIdx) => {
          const value = Number(evaluations[optIdx]?.[critIdx])
          const explanation = evaluations[optIdx]?.[`explanation_${critIdx}`] || null
          if (!isNaN(value)) {
            evaluationsArray.push({
              option_index: optIdx,
              criterion_index: critIdx,
              value,
              explanation
            })
          }
        })
      })

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
      if (!resEval.ok) throw new Error(dataEval.error || 'Failed to save evaluations')

      navigate(`/decision/${decisionId}`)
    } catch (err) {
      console.error('❌ Save error:', err.message)
      alert(`❌ Save error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative max-w-4xl mx-auto py-12 px-4">
      {loading && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-sm text-center">
            <p className="text-gray-800 dark:text-gray-100 text-sm animate-pulse">
              ⏳ GPT is evaluating your inputs...
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">➕ Create New Decision</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="text" placeholder="Decision title" value={decisionName} onChange={e => setDecisionName(e.target.value)} className="w-full border px-4 py-2 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white" required />
          <textarea placeholder="Describe your decision..." value={description} onChange={e => setDescription(e.target.value)} className="w-full border px-4 py-2 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white" rows="3" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select value={mode} onChange={e => setMode(e.target.value)} className="w-full border px-4 py-2 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
              <option value="manual">Manual</option>
              <option value="ai">AI</option>
            </select>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full border px-4 py-2 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-800 dark:text-white mb-1">Options</label>
            {options.map((opt, i) => (
              <input key={i} type="text" value={opt} onChange={(e) => {
                const newOptions = [...options]
                newOptions[i] = e.target.value
                setOptions(newOptions)
                updateEvaluations(newOptions, criteria)
              }} className="w-full border px-4 py-2 rounded mb-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" required />
            ))}
            <button type="button" onClick={handleAddOption} className="text-sm text-blue-600 hover:underline">➕ Add Option</button>
          </div>

          <div>
            <label className="block font-semibold text-gray-800 dark:text-white mb-1">Criteria (importance in %)</label>
            {criteria.map((crit, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input type="text" value={crit.name} onChange={e => {
                  const newCrit = [...criteria]
                  newCrit[i].name = e.target.value
                  setCriteria(newCrit)
                  updateEvaluations(options, newCrit)
                }} className="flex-1 border px-3 py-2 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white" required />
                <input type="number" value={crit.importance} onChange={e => {
                  const newCrit = [...criteria]
                  newCrit[i].importance = e.target.value
                  setCriteria(newCrit)
                }} className="w-20 border px-3 py-2 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white" required />
              </div>
            ))}
            <button type="button" onClick={handleAddCriterion} className="text-sm text-blue-600 hover:underline">➕ Add Criterion</button>
          </div>

          {mode === 'ai' && !gptFinished && (
            <>
              <div className="text-sm text-yellow-800 bg-yellow-100 dark:bg-yellow-200 dark:text-yellow-900 p-4 rounded">
                GPT will analyze your inputs and suggest a scoring.
              </div>
              <button type="button" onClick={handleGPTRecommendation} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition">
                🤖 Generate Score
              </button>
            </>
          )}

          {(mode === 'manual' || gptFinished) && (
            <>
              <label className="font-semibold text-gray-800 dark:text-white">Evaluate each option per criterion (1–10)</label>
              <div className="overflow-auto">
                <table className="min-w-full border border-gray-300 dark:border-gray-700 text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="border px-2 py-1 text-left">Option</th>
                      {criteria.map((c, ci) => (
                        <th key={ci} className="border px-2 py-1 text-left">{c.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {options.map((opt, oi) => (
                      <tr key={oi} className="even:bg-gray-50 dark:even:bg-gray-900">
                        <td className="border px-2 py-1 font-medium">{opt}</td>
                        {criteria.map((_, ci) => (
                          <td key={ci} className="border px-2 py-1">
                            <input type="number" min="1" max="10" value={evaluations[oi]?.[ci] || ''} onChange={(e) => handleEvaluationChange(oi, ci, e.target.value)} className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                💾 Save Decision
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  )
}

export default NewDecision
