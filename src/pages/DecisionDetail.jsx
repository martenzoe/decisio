import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { useAuthStore } from '../store/useAuthStore'

export default function DecisionDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [comments, setComments] = useState([])
  const [commentInput, setCommentInput] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const { user, token } = useAuthStore()

  // NEW: AI summary state
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)
  const [aiSummary, setAiSummary] = useState(null)
  const [aiTopOption, setAiTopOption] = useState(null)

  useEffect(() => {
    if (user && token && id) {
      fetchData()
      fetchComments()
    }
  }, [user, token, id])

  useEffect(() => {
    if (editingId && inputRef.current) inputRef.current.focus()
  }, [editingId])

  async function fetchData() {
    try {
      const res = await fetch(`/api/decision/${id}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      if (!res.ok || !json.decision) throw new Error(json.error || 'No decision found')
      setData(json)

      // If this is an AI decision, fetch a short AI summary (does NOT save anything)
      if (json.decision?.mode === 'ai') {
        fetchAiSummary(json)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  // Only reads a summary/top option from the AI endpoint; does not persist anything.
  async function fetchAiSummary(details) {
    setAiLoading(true)
    setAiError(null)
    try {
      const decisionName = details?.decision?.name || details?.decision?.title || ''
      const description = details?.decision?.description || ''
      const options = (details?.options || []).map(o => o.name)
      const criteria = (details?.criteria || []).map(c => ({ name: c.name }))

      const res = await fetch('/api/ai/recommendation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ decisionName, description, options, criteria })
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'AI summary failed')

      // From your ai.js: { recommendations, summary, top_option, top_option_index }
      setAiSummary(json.summary || null)
      setAiTopOption(json.top_option || null)
    } catch (e) {
      console.error('AI summary error:', e)
      setAiError(e.message)
    } finally {
      setAiLoading(false)
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
      console.error('❌ Error loading comments:', err)
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
    if (!window.confirm('Are you sure you want to delete this comment?')) return
    const res = await fetch(`/api/comments/${commentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) fetchComments()
  }

  if (error) return <div className="text-red-500 text-center mt-10">{error}</div>
  if (!user || !data) return <div className="text-gray-400 text-center mt-10">⏳ Loading decision…</div>

  const { decision, options = [], criteria = [], evaluations = [] } = data

  const getScore = (optionId) => {
    const evals = evaluations.filter(e => e.option_id === optionId)
    const total = evals.reduce((acc, e) => {
      const crit = criteria.find(c => c.id === e.criterion_id)
      return acc + ((crit?.importance ?? 0) * e.value) / 100
    }, 0)
    return Math.round(total * 10) / 10
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-8 text-gray-900 dark:text-gray-100">
      {/* Decision Summary */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-2">{decision.title || decision.name}</h2>
        <p className="text-gray-600 dark:text-gray-300">{decision.description}</p>
      </div>

      {/* Evaluation Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6 overflow-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="border px-4 py-2">Option</th>
              {criteria.map(c => (
                <th key={c.id} className="border px-4 py-2">{c.name}</th>
              ))}
              <th className="border px-4 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {options.map(o => (
              <tr key={o.id}>
                <td className="border px-4 py-2">{o.name}</td>
                {criteria.map(c => {
                  const evalItem = evaluations.find(e => e.option_id === o.id && e.criterion_id === c.id)
                  return (
                    <td key={c.id} className="border px-4 py-2 text-center">
                      {evalItem ? evalItem.value : '-'}
                    </td>
                  )
                })}
                <td className="border px-4 py-2 text-center font-semibold">{getScore(o.id)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* AI summary box (only for AI decisions) */}
        {decision.mode === 'ai' && (
          <div className="mt-6">
            <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">🤖 AI Summary</h4>

                  {aiLoading && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Generating summary …
                    </p>
                  )}

                  {aiError && (
                    <p className="text-sm text-red-600">
                      {aiError}
                    </p>
                  )}

                  {!aiLoading && !aiError && (
                    <>
                      {aiTopOption && (
                        <p className="text-sm">
                          <span className="font-medium">🏆 Top option:</span> {aiTopOption}
                        </p>
                      )}
                      {aiSummary && (
                        <p className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-line">
                          {aiSummary}
                        </p>
                      )}
                      {!aiSummary && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          No AI summary available.
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Manual refresh button for summary */}
                <button
                  onClick={() => fetchAiSummary(data)}
                  className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm border border-indigo-300 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-800 transition"
                >
                  🔄 Refresh
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-6 space-y-4">
        <h3 className="text-xl font-semibold">💬 Comments</h3>

        <form onSubmit={handleCommentSubmit} className="flex flex-col sm:flex-row gap-4">
          <input
            ref={inputRef}
            value={commentInput}
            onChange={e => setCommentInput(e.target.value)}
            placeholder="Write a comment…"
            className="flex-1 px-4 py-2 border rounded-md dark:bg-gray-900 dark:border-gray-600"
          />
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition">
            {editingId ? '💾 Save' : '➕ Post'}
          </button>
        </form>

        <div className="space-y-4">
          {comments.map(c => (
            <div key={c.id} className="border-t border-gray-200 dark:border-gray-600 pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">
                    {c.nickname ? `@${c.nickname}` : 'Anonymous'}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">{c.text}</p>
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </p>
                </div>

                {String(user?.id) === String(c.user_id) && (
                  <div className="flex gap-2 text-sm mt-1">
                    <button onClick={() => handleEdit(c)} className="text-blue-500 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:underline">Delete</button>
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
