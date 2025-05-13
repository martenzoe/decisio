// src/pages/DecisionDetail.jsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

function DecisionDetail() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const [decision, setDecision] = useState(null)
  const [options, setOptions] = useState([])
  const [criteria, setCriteria] = useState([])
  const [evaluations, setEvaluations] = useState({})
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token')
      if (!token) return

      const [dRes, oRes, cRes, eRes] = await Promise.all([
        fetch(`http://localhost:3000/api/decision/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`http://localhost:3000/api/decision/${id}/options`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`http://localhost:3000/api/decision/${id}/criteria`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`http://localhost:3000/api/decision/${id}/evaluations`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const decision = await dRes.json()
      const options = await oRes.json()
      const criteria = await cRes.json()
      const evaluationData = await eRes.json()

      setDecision(decision)
      setOptions(options)
      setCriteria(criteria)

      // 🧠 Initialisiere Bewertungen
      const initial = {}
      options.forEach((opt) => {
        initial[opt.id] = {}
        criteria.forEach((crit) => {
          const found = evaluationData.find(
            (ev) => ev.option_id === opt.id && ev.criterion_id === crit.id
          )
          initial[opt.id][crit.id] = found ? found.value : ''
        })
      })
      setEvaluations(initial)
    }

    fetchData()
  }, [id])

  const handleChange = (optId, critId, value) => {
    setEvaluations((prev) => ({
      ...prev,
      [optId]: {
        ...prev[optId],
        [critId]: value,
      },
    }))
  }

  const calculateScore = (optId) => {
    const scores = evaluations[optId]
    let total = 0
    let weightSum = 0

    for (const critId in scores) {
      const crit = criteria.find((c) => c.id === critId)
      const weight = crit?.weight || 0
      const value = Number(scores[critId]) || 0
      total += value * weight
      weightSum += weight
    }

    return weightSum ? Math.round(total / weightSum) : 0
  }

  const handleSave = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    const payload = []
    for (const optId in evaluations) {
      for (const critId in evaluations[optId]) {
        payload.push({
          option_id: optId,
          criterion_id: critId,
          value: Number(evaluations[optId][critId]) || 0,
        })
      }
    }

    const res = await fetch(`http://localhost:3000/api/decision/${id}/evaluations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ evaluations: payload }),
    })

    const data = await res.json()

    if (res.ok) {
      setMessage('✅ Bewertung gespeichert!')
    } else {
      setMessage(`❌ Fehler: ${data.error || 'Speichern fehlgeschlagen'}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h2 className="text-2xl font-bold mb-4">🔍 Entscheidung: {decision?.name}</h2>
      <p className="mb-6">{decision?.description}</p>

      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="border p-2">Option</th>
              {criteria.map((c) => (
                <th key={c.id} className="border p-2">
                  {c.name} ({c.weight})
                </th>
              ))}
              <th className="border p-2">Score</th>
            </tr>
          </thead>
          <tbody>
            {options.map((opt) => (
              <tr key={opt.id}>
                <td className="border p-2 font-semibold">{opt.name}</td>
                {criteria.map((crit) => (
                  <td key={crit.id} className="border p-2">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={evaluations[opt.id]?.[crit.id] || ''}
                      onChange={(e) =>
                        handleChange(opt.id, crit.id, e.target.value)
                      }
                      className="w-16 px-2 py-1 border rounded"
                    />
                  </td>
                ))}
                <td className="border p-2 font-bold text-center">
                  {calculateScore(opt.id)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
        >
          💾 Bewertung speichern
        </button>
      </div>

      {message && <p className="text-center mt-4 text-red-600">{message}</p>}
    </div>
  )
}

export default DecisionDetail
