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

  const [comment, setComment] = useState('')
  const [comments, setComments] = useState([])

  // Entscheidung + Details laden
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token')
      if (!token) return

      try {
        const res = await fetch(`http://localhost:3000/api/decision/${id}/details`, {
          headers: { Authorization: `Bearer ${token}` },
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

  // Score berechnen
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

  // Kommentare laden
  useEffect(() => {
    const fetchComments = async () => {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:3000/api/decision/${id}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setComments(data)
    }

    fetchComments()
  }, [id])

  // Kommentar absenden
  const handleCommentSubmit = async () => {
    if (comment.trim() === '') return

    const token = localStorage.getItem('token')
    const res = await fetch(`http://localhost:3000/api/decision/${id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text: comment }),
    })

    if (res.ok) {
      const newComment = await res.json()
      setComments(prev => [newComment, ...prev])
      setComment('')
    }
  }

  if (loading) return <div className="text-center py-10">⏳ Lädt ...</div>

  return (
    <div className="min-h-screen bg-[#A7D7C5] py-10 px-4">
      <div className="bg-white p-6 rounded-2xl shadow-md max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">🔍 Entscheidung: {decision?.name}</h2>
        <p className="text-gray-600 mb-2">{decision?.description}</p>
        <p className="text-xs text-gray-500">
          Erstellt: {new Date(decision.created_at).toLocaleString()}<br />
          Letzte Änderung: {new Date(decision.updated_at).toLocaleString()}
        </p>

        <div className="overflow-x-auto mt-6">
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
                  <td className="border p-2 text-center font-bold text-green-800">{scoreMap[opt.id] ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10">
          <h3 className="text-lg font-semibold mb-2">💬 Kommentare</h3>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Schreibe einen Kommentar..."
            className="w-full border rounded p-2 mb-2"
            rows={3}
          />
          <button
            onClick={handleCommentSubmit}
            className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
          >
            Kommentar hinzufügen
          </button>

          <div className="mt-4 space-y-2">
            {comments.map((c) => (
              <div key={c.id} className="bg-gray-100 rounded p-2">
                <p className="text-sm">{c.text}</p>
                <p className="text-xs text-gray-500">{new Date(c.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DecisionDetail
