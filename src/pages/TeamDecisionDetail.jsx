import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { useAuthStore } from '../store/useAuthStore'
import EvaluateTeamDecision from './EvaluateTeamDecision'

export default function TeamDecisionDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pollTries, setPollTries] = useState(0)
  const [comments, setComments] = useState([])
  const [commentInput, setCommentInput] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const token = useAuthStore((s) => s.token)
  const { user } = useAuthStore()

  useEffect(() => {
    if (user?.id && id && token) {
      setLoading(true)
      fetchData()
      fetchComments()
    }
    // eslint-disable-next-line
  }, [user?.id, id, token])

  useEffect(() => {
    if (
      data &&
      pollTries < 4 &&
      (
        !Array.isArray(data.options) || data.options.length === 0 ||
        !Array.isArray(data.criteria) || data.criteria.length === 0
      )
    ) {
      const timer = setTimeout(() => {
        setPollTries(t => t + 1)
        fetchData()
      }, 500)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line
  }, [data, pollTries])

  useEffect(() => {
    if (editingId && inputRef.current) inputRef.current.focus()
  }, [editingId])

  async function fetchData() {
    try {
      const res = await fetch(`/api/decision/${id}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      if (!res.ok || !json.decision) throw new Error(json.error || 'Keine Team-Entscheidung gefunden')
      setData(json)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchComments() {
    try {
      const res = await fetch(`/api/comments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      setComments(Array.isArray(json) ? json : [])
    } catch (err) {
      console.error('❌ Fehler beim Laden der Kommentare:', err)
    }
  }

  async function handleCommentSubmit(e) {
    e.preventDefault()
    if (!commentInput.trim()) return

    const method = editingId ? 'PUT' : 'POST'
    const url = editingId ? `/api/comments/${editingId}` : '/api/comments'
    const body = editingId
      ? { text: commentInput }
      : { decision_id: id, text: commentInput }

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    })

    if (res.ok) {
      setCommentInput('')
      setEditingId(null)
      fetchComments()
    }
  }

  function handleEdit(comment) {
    setEditingId(comment.id)
    setCommentInput(comment.text)
  }

  async function handleDelete(commentId) {
    if (!window.confirm('Kommentar wirklich löschen?')) return
    const res = await fetch(`/api/comments/${commentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) fetchComments()
  }

  const { decision, options = [], criteria = [], evaluations = [], userRole } = data || {}

  // Liefert für jede Option und Kriterium: Mittelwert aller Scores (über alle Teammitglieder)
  function getMeanScore(optionId, criterionId) {
    const relevant = evaluations.filter(
      (e) => e.option_id === optionId && e.criterion_id === criterionId
    )
    if (!relevant.length) return null
    const avg = relevant.reduce((sum, e) => sum + (Number(e.value) || 0), 0) / relevant.length
    return Math.round(avg * 10) / 10
  }

  // Gesamtscore: Summe aller (MeanScore * Wichtigkeit)
  function getTotalScore(optionId) {
    if (!criteria.length) return '-'
    let total = 0
    let weightSum = 0
    criteria.forEach((crit) => {
      const avg = getMeanScore(optionId, crit.id)
      const imp = Number(crit.importance) || 0
      if (avg !== null) {
        total += avg * imp
        weightSum += imp
      }
    })
    if (weightSum > 0) total = total / weightSum * 100
    return Math.round(total * 10) / 10
  }

  if (error) return <div className="text-red-500 text-center mt-10">{error}</div>
  if (!user || loading) return <div className="text-gray-400 text-center mt-10">⏳ Team-Entscheidung wird geladen …</div>
  if (!decision) return <div className="text-red-500 text-center mt-10">Entscheidung nicht gefunden.</div>
  if (
    (options.length === 0 || criteria.length === 0) &&
    pollTries >= 4
  ) {
    return (
      <div className="text-yellow-600 text-center mt-10">
        Optionen oder Kriterien konnten nicht geladen werden.<br />
        Bitte aktualisiere die Seite oder probiere es später erneut.<br />
        <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded" onClick={fetchData}>
          Erneut versuchen
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-8 text-gray-900 dark:text-gray-100">
      <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-2">{decision.name}</h2>
        <p className="text-gray-600 dark:text-gray-300">{decision.description}</p>
      </div>



      <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6 overflow-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="border px-4 py-2">Option</th>
              {criteria.map(c => (
                <th key={c.id} className="border px-4 py-2">{c.name} <span className="text-xs text-gray-400">({c.importance}%)</span></th>
              ))}
              <th className="border px-4 py-2">Gesamt</th>
            </tr>
          </thead>
          <tbody>
            {options.map(o => (
              <tr key={o.id}>
                <td className="border px-4 py-2">{o.name}</td>
                {criteria.map(c => {
                  const avg = getMeanScore(o.id, c.id)
                  return (
                    <td key={c.id} className="border px-4 py-2 text-center">
                      {avg !== null ? avg : '-'}
                    </td>
                  )
                })}
                <td className="border px-4 py-2 text-center font-semibold">{getTotalScore(o.id)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-6 space-y-4">
        <h3 className="text-xl font-semibold">💬 Kommentare</h3>
        <form onSubmit={handleCommentSubmit} className="flex flex-col sm:flex-row gap-4">
          <input
            ref={inputRef}
            value={commentInput}
            onChange={e => setCommentInput(e.target.value)}
            placeholder="Kommentiere hier …"
            className="flex-1 px-4 py-2 border rounded-md dark:bg-gray-900 dark:border-gray-600"
          />
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition">
            {editingId ? '💾 Speichern' : '➕ Posten'}
          </button>
        </form>
        <div className="space-y-4">
          {comments.map(c => (
            <div key={c.id} className="border-t border-gray-200 dark:border-gray-600 pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">
                    {c.nickname ? `@${c.nickname}` : 'Anonym'}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">{c.text}</p>
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </p>
                </div>
                {String(user?.id) === String(c.user_id) && (
                  <div className="flex gap-2 text-sm mt-1">
                    <button onClick={() => handleEdit(c)} className="text-blue-500 hover:underline">Bearbeiten</button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:underline">Löschen</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
