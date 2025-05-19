// src/pages/DecisionDetail.jsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

function DecisionDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const fetchData = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/decision/${id}/details`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Fehler beim Laden')
        setData(json)
      } catch (err) {
        setError(err.message)
      }
    }

    fetchData()
  }, [id])

  if (error) return <div className="text-red-600">{error}</div>
  if (!data) return <div className="text-gray-600">⏳ Lädt...</div>

  const { decision, options, criteria, evaluations } = data

  const getScore = (optionId) => {
    const evals = evaluations.filter(e => e.option_id === optionId)
    const weighted = evals.map(e => {
      const crit = criteria.find(c => c.id === e.criterion_id)
      return crit ? (e.value * crit.importance) / 100 : 0
    })
    if (!weighted.length) return 0
    const score = weighted.reduce((a, b) => a + b, 0)
    return Math.round(score * 10) / 10
  }

  const getExplanation = (optionId, criterionId) => {
    const match = evaluations.find(e => e.option_id === optionId && e.criterion_id === criterionId)
    return match?.explanation || ''
  }

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-6">
      <h2 className="text-3xl font-bold">{decision.name}</h2>
      <p className="text-gray-700">{decision.description}</p>

      <div>
        <h3 className="text-xl font-semibold mb-2">🔎 Bewertungen im Detail</h3>
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">Option</th>
              {criteria.map(c => (
                <th key={c.id} className="border p-2 text-left">
                  {c.name} ({c.importance}%)
                </th>
              ))}
              <th className="border p-2 text-left">Score</th>
            </tr>
          </thead>
          <tbody>
            {options.map(opt => (
              <tr key={opt.id} className="hover:bg-gray-50">
                <td className="border p-2 font-medium">{opt.name}</td>
                {criteria.map(crit => {
                  const match = evaluations.find(e => e.option_id === opt.id && e.criterion_id === crit.id)
                  return (
                    <td key={crit.id} className="border p-2">
                      <div>
                        <strong>{match?.value || '-'}</strong>
                        {match?.explanation && (
                          <div className="text-gray-600 text-xs mt-1 italic">
                            {match.explanation}
                          </div>
                        )}
                      </div>
                    </td>
                  )
                })}
                <td className="border p-2 font-bold text-blue-700">{getScore(opt.id)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DecisionDetail
