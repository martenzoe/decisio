import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format, formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { useAuthStore } from '../store/useAuthStore'

export default function TeamDecisionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
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
    } catch (err) { }
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

  // ==== Team- & Bewertungslogik ====
  const {
    decision,
    options = [],
    criteria = [],
    evaluations = [],
    weightsByUser = {},
    teamMembers = [],
    userRole
  } = data || {}

  // DEADLINE-Logik
  const deadline = data?.timer ? new Date(data.timer) : null
  const now = new Date()
  const isClosed = !!deadline && now > deadline
  const isAdmin = userRole && ['owner', 'admin'].includes(userRole)

  // Team-Gewichtungen: Mittelwert je Kriterium, Fallback zu importance
  function getMeanTeamWeights() {
    const sum = {}
    const count = {}
    Object.values(weightsByUser).forEach(wArr => {
      wArr.forEach(w => {
        sum[w.criterion_id] = (sum[w.criterion_id] || 0) + Number(w.weight)
        count[w.criterion_id] = (count[w.criterion_id] || 0) + 1
      })
    })
    const result = {}
    criteria.forEach(c => {
      result[c.id] = count[c.id]
        ? Math.round((sum[c.id] / count[c.id]) * 10) / 10
        : (Number(c.importance) || 0)
    })
    return result
  }
  const meanTeamWeights = getMeanTeamWeights()

  // Durchschnitt pro Feld (alle User)
  function getMeanScore(optionId, criterionId) {
    const relevant = evaluations.filter(
      (e) => e.option_id === optionId && e.criterion_id === criterionId
    )
    if (!relevant.length) return null
    const avg = relevant.reduce((sum, e) => sum + (Number(e.value) || 0), 0) / relevant.length
    return Math.round(avg * 10) / 10
  }

  // Team-Durchschnitt als gewichteter Mittelwert aller User
  function getTeamWeightedScore(optionId, weightsMap) {
    if (!criteria.length) return '-'
    const byUser = {}
    evaluations.forEach(e => {
      if (e.option_id === optionId) {
        if (!byUser[e.user_id]) byUser[e.user_id] = {}
        byUser[e.user_id][e.criterion_id] = Number(e.value)
      }
    })
    const userScores = Object.values(byUser).map(critVals => {
      let total = 0
      let weightSum = 0
      criteria.forEach(crit => {
        const val = critVals[crit.id]
        const weight = Number(weightsMap[crit.id]) || 0
        if (typeof val === 'number' && weight > 0) {
          total += val * weight
          weightSum += weight
        }
      })
      if (weightSum > 0) return total / weightSum * 100
      return null
    }).filter(x => x !== null)
    if (!userScores.length) return 0
    const avg = userScores.reduce((sum, s) => sum + s, 0) / userScores.length
    return Math.round(avg * 10) / 10
  }

  // Wer hat abgestimmt (mind. 1 Bewertung)?
  function getVoters() {
    const votedMap = {}
    evaluations.forEach(e => {
      if (e && e.user_id) votedMap[String(e.user_id)] = true
    })
    return teamMembers.map(m => ({
      ...m,
      voted: !!votedMap[String(m.user_id)]
    }))
  }
  const teamWithStatus = getVoters()

  // ==== Render ====
  if (error) return <div className="text-red-500 text-center mt-10">{error}</div>
  if (!user || loading) return <div className="text-gray-400 text-center mt-10">⏳ Team-Entscheidung wird geladen …</div>
  if (!decision) return <div className="text-red-500 text-center mt-10">Entscheidung nicht gefunden.</div>

  if (
    (options.length === 0 || criteria.length === 0) &&
    pollTries >= 4
  ) {
    return (
      <div className="text-yellow-700 bg-yellow-50 border border-yellow-300 max-w-xl mx-auto mt-10 p-6 rounded-xl text-center">
        Optionen oder Kriterien wurden noch nicht angelegt.<br />
        <span className="text-sm text-gray-500">Sobald mindestens eine Option und ein Kriterium angelegt sind, erscheint hier die Auswertung.</span><br />
        <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded" onClick={fetchData}>
          Erneut versuchen
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-8 text-gray-900 dark:text-gray-100">
      {/* DEADLINE-BADGE */}
      <div className="flex flex-wrap gap-4 items-center mb-2">
        {deadline ? (
          <div className={`rounded-lg px-4 py-2 text-sm font-bold shadow ${isClosed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            <span>
              Deadline:&nbsp;
              <span className="font-semibold">{format(deadline, 'Pp', { locale: de })}</span>
              &nbsp;–&nbsp;
              {isClosed
                ? <span>Abgelaufen <span className="text-xs font-normal">(Voting gesperrt)</span></span>
                : <span>Noch {formatDistanceToNow(deadline, { addSuffix: true, locale: de })}</span>
              }
            </span>
          </div>
        ) : (
          <div className="rounded-lg px-4 py-2 text-sm shadow bg-gray-100 text-gray-500">
            Keine Deadline gesetzt.
          </div>
        )}
        {isAdmin && (
          <button
            className="ml-2 text-blue-700 underline text-xs"
            onClick={() => navigate(`/team-decision/${decision.id}/edit`)}
          >
            Deadline ändern
          </button>
        )}
      </div>

      {/* TEAM + Status */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6 mb-4">
        <h3 className="text-lg font-bold mb-2">Team & Status</h3>
        <div className="flex flex-wrap gap-6">
          {teamWithStatus.length === 0 ? (
            <span className="text-gray-400">Keine Teammitglieder gefunden.</span>
          ) : (
            teamWithStatus.map(m => (
              <div
                key={m.user_id}
                className={`flex items-center px-4 py-2 rounded-lg shadow-sm border ${m.voted ? 'bg-green-100 dark:bg-green-900 border-green-400' : 'bg-yellow-50 dark:bg-yellow-900 border-yellow-400'}`}
                style={{ minWidth: 220 }}
              >
                <span className="text-2xl mr-2">{m.voted ? '✅' : '⏳'}</span>
                <div>
                  <span className="font-semibold">{m.users?.nickname || m.email || 'Unbekannt'}</span>
                  <div className="text-xs text-gray-500">
                    Rolle: {m.role}
                    {m.voted
                      ? <span className="ml-2 text-green-700">Abgestimmt</span>
                      : <span className="ml-2 text-yellow-700">Ausstehend</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Entscheidungstitel & Beschreibung */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-2">{decision.name}</h2>
        <p className="text-gray-600 dark:text-gray-300">{decision.description}</p>
      </div>

      {/* Bewertungs-Tabelle */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6 overflow-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="border px-4 py-2">Option</th>
              {criteria.map(c => (
                <th key={c.id} className="border px-4 py-2">
                  {c.name}
                  <span className="text-xs text-gray-400">
                    {meanTeamWeights[c.id] ? ` (Team: ${meanTeamWeights[c.id]})` : ''}
                  </span>
                </th>
              ))}
              <th className="border px-4 py-2">Team-Ergebnis</th>
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
                <td className="border px-4 py-2 text-center font-semibold">
                  {Object.keys(meanTeamWeights).length
                    ? getTeamWeightedScore(o.id, meanTeamWeights)
                    : <span className="text-gray-400">-</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-xs text-gray-400 mt-2">
          Die Gewichtung (in Klammern) ist der Team-Durchschnitt oder die voreingestellte Gewichtung.<br />
          Die Ergebnisse sind für alle Teammitglieder identisch. Änderungen gehen nur über die Bewertungsmaske.
        </div>
      </div>

      {/* Kommentare */}
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
