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
  const [evaluations, setEvaluations] = useState([])
  const [scoreMap, setScoreMap] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token')
      if (!token) return

      try {
        const res = await fetch(`http://localhost:3000/api/decision/${id}/details`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Fehler beim Laden')

        setDecision(data.decision)
        setOptions(data.options)
        setCriteria(data.criteria)
        setEvaluations(data.evaluations)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  useEffect(() => {
    const calculateScores = () => {
      const scoreObj = {}
      options.forEach(opt => {
        const evals = evaluations.filter(e => e.option_id === opt.id)
        let total = 0
        let weightSum = 0

        evals.forEach(ev => {
          const criterion = criteria.find(c => c.id === ev.criterion_id)
          if (!criterion) return
          const weight = criterion.importance || 0
          const value = ev.value || 0
          total += weight * value
          weightSum += weight
        })

        scoreObj[opt.id] = weightSum ? Math.round(total / weightSum) : 0
      })
      setScoreMap(scoreObj)
    }

    if (options.length && criteria.length && evaluations.length) {
      calculateScores()
    }
  }, [options, criteria, evaluations])

  if (loading) return <div className="text-center py-10">⏳ Lädt ...</div>

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h2 className="text-2xl font-bold mb-2">🔍 Entscheidung: {decision?.name}</h2>
      <p className="mb-6 text-gray-600">{decision?.description}</p>

      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="border p-2">Option</th>
              {criteria.map(c => (
                <th key={c.id} className="border p-2">{c.name} ({c.importance}%)</th>
              ))}
              <th className="border p-2">Score</th>
            </tr>
          </thead>
          <tbody>
            {options.map(opt => (
              <tr key={opt.id}>
                <td className="border p-2 font-semibold">{opt.name}</td>
                {criteria.map(crit => {
                  const ev = evaluations.find(e => e.option_id === opt.id && e.criterion_id === crit.id)
                  return (
                    <td key={crit.id} className="border p-2 text-center">{ev?.value ?? '-'}</td>
                  )
                })}
                <td className="border p-2 font-bold text-center">{scoreMap[opt.id] ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DecisionDetail
