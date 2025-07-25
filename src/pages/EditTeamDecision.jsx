import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import EvaluateTeamDecision from './EvaluateTeamDecision'
import TeamCriterionWeighting from '../components/TeamCriterionWeighting'

export default function EditTeamDecision() {
  const { id } = useParams()
  const { user, token } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [reload, setReload] = useState(0)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [options, setOptions] = useState([])
  const [criteria, setCriteria] = useState([])
  const [userRole, setUserRole] = useState('viewer')
  const [evaluations, setEvaluations] = useState([])
  const [weights, setWeights] = useState([])
  const [deadline, setDeadline] = useState('')

  // Deadline-Check
  const deadlineDate = deadline ? new Date(deadline) : null
  const now = new Date()
  const isClosed = !!deadlineDate && now > deadlineDate

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      try {
        const res = await fetch(`/api/decision/${id}/details`, { headers: { Authorization: `Bearer ${token}` } })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Fehler beim Laden')
        setName(json.decision.name || '')
        setDescription(json.decision.description || '')
        setOptions(Array.isArray(json.options) ? json.options : [])
        setCriteria(Array.isArray(json.criteria) ? json.criteria.map(c => ({
          ...c,
          importance: typeof c.importance === 'number' ? c.importance : (c.importance ? Number(c.importance) : 0)
        })) : [])
        setUserRole(json.userRole)
        setDeadline(json.timer || '')
        if (json.weightsByUser && user && user.id) {
          setWeights(json.weightsByUser[user.id] || [])
        } else {
          setWeights([])
        }
        if (user && Array.isArray(json.evaluations)) {
          const userEvals = json.evaluations.filter(e => String(e.user_id) === String(user.id))
          if (userEvals.length === 0 && json.options.length && json.criteria.length) {
            const blank = []
            json.options.forEach(o => {
              json.criteria.forEach(c => {
                blank.push({ option_id: o.id, criterion_id: c.id, value: '' })
              })
            })
            setEvaluations(blank)
          } else {
            setEvaluations(userEvals)
          }
        }
        setSuccess(null)
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    if (user && id && token) fetchAll()
    // eslint-disable-next-line
  }, [user, id, token, reload])

  // Dedupe-Helpers
  function isDuplicate(array, key, value, idx) {
    return array.some((item, i) =>
      i !== idx &&
      item[key] &&
      value &&
      item[key].trim().toLowerCase() === value.trim().toLowerCase()
    )
  }
  const handleOptionChange = (idx, value) => setOptions(o =>
    o.map((op, i) =>
      i === idx
        ? isDuplicate(o, 'name', value, idx)
          ? { ...op, name: value, _dup: true }
          : { ...op, name: value, _dup: false }
        : { ...op, _dup: false }
    )
  )
  const addOption = () => setOptions([
    ...options,
    { name: '', id: `opt-new-${Date.now()}-${Math.random().toString(36).slice(2)}`, _dup: false }
  ])
  const removeOption = idx => setOptions(options.filter((_, i) => i !== idx))
  const handleCriterionChange = (idx, key, value) => setCriteria(cr =>
    cr.map((c, i) =>
      i === idx
        ? isDuplicate(cr, 'name', value, idx)
          ? { ...c, [key]: value, _dup: true }
          : { ...c, [key]: value, _dup: false }
        : { ...c, _dup: false }
    )
  )
  const addCriterion = () => setCriteria([
    ...criteria,
    { name: '', importance: '', id: `crit-new-${Date.now()}-${Math.random().toString(36).slice(2)}`, _dup: false }
  ])
  const removeCriterion = idx => setCriteria(criteria.filter((_, i) => i !== idx))
  function dupClass(obj) {
    return obj._dup ? 'border-2 border-red-500 bg-red-50 dark:bg-red-900' : ''
  }

  // Hilfsfunktion Deadline
  function getMinDeadline() {
    const now = new Date(Date.now() + 5 * 60000)
    return now.toISOString().slice(0, 16)
  }

  // Deadline PATCH (immer verfügbar für Admins/Owner)
  async function saveDeadline(newTimer) {
    setError(null)
    try {
      const res = await fetch(`/api/decision/${id}/timer`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ timer: newTimer || null })
      })
      if (!res.ok) throw new Error('Fehler beim Speichern der Deadline')
      setSuccess('Deadline gespeichert!')
      setReload(r => r + 1)
    } catch (err) {
      setError(err.message)
    }
  }

  // ALLES speichern – auch Name/Beschreibung/Meta-Änderungen
  async function handleSaveAll() {
    setError(null)
    setSuccess(null)
    try {
      // Speichere Metadaten (inkl. Name, Desc, Optionen, Kriterien)
      const cleanOptions = options.filter(o => o.name && o.name.trim() !== '' && !o._dup).map(({ name }) => ({ name }))
      const cleanCriteria = criteria.filter(c => c.name && c.name.trim() !== '' && !c._dup).map(({ name, importance }) => ({
        name,
        importance: importance === '' || importance == null ? 0 : Number(importance)
      }))
      const resMeta = await fetch(`/api/decision/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name,
          description,
          mode: 'manual',
          type: 'team',
          options: cleanOptions,
          criteria: cleanCriteria
        })
      })
      if (!resMeta.ok) throw new Error('Fehler beim Speichern der Metadaten')

      // Speichere Gewichtung
      await fetch(`/api/decision/${id}/weights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          weights: criteria.map(c => {
            const entry = weights.find(w => w.criterion_id === c.id)
            return {
              criterion_id: c.id,
              weight: entry && typeof entry.weight === 'number' ? entry.weight : Number(entry && entry.weight) || 0
            }
          })
        })
      })
      // Speichere Bewertung
      await fetch(`/api/decision/${id}/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          evaluations: evaluations
            .filter(e => e.value !== '' && !isNaN(Number(e.value)))
            .map(e => ({
              option_id: e.option_id,
              criterion_id: e.criterion_id,
              value: Number(e.value)
            }))
        })
      })
      setSuccess('Gespeichert!')
      setTimeout(() => setSuccess(null), 2000)
      setReload(r => r + 1)
    } catch (err) {
      setError('Fehler beim Speichern.')
    }
  }

  if (loading) return <div className="p-8">⏳ Lädt…</div>
  if (error) return <div className="text-red-500 p-8">{error}</div>
  if (userRole === 'viewer') {
    return (
      <div className="max-w-3xl mx-auto py-8 px-2 md:px-6">
        <h2 className="text-2xl font-bold mb-6">Team-Entscheidung bewerten</h2>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow mb-10">
          <div className="mb-4">
            <label className="block text-gray-600 font-semibold mb-2">Optionen:</label>
            <ul className="list-disc ml-6">{options.map((opt, i) => <li key={opt.id || i}>{opt.name}</li>)}</ul>
          </div>
          <div>
            <label className="block text-gray-600 font-semibold mb-2">Kriterien:</label>
            <ul className="list-disc ml-6">{criteria.map((c, i) => <li key={c.id || i}>{c.name}</li>)}</ul>
          </div>
        </div>
      </div>
    )
  }

  // --------- OWNER/ADMIN/EDITOR VIEW ---------
  return (
    <div className="max-w-3xl mx-auto py-8 px-2 md:px-6">
      <h2 className="text-2xl font-bold mb-6">✏️ Team-Entscheidung bearbeiten</h2>
      {/* Titel & Beschreibung editierbar */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow mb-8">
        <label className="block text-gray-500 mb-1 font-semibold">Titel</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="mb-4 p-2 border rounded w-full"
          disabled={isClosed}
        />
        <label className="block text-gray-500 mb-1 font-semibold">Beschreibung</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="mb-4 p-2 border rounded w-full"
          disabled={isClosed}
          rows={2}
        />
        {/* Deadline: nur Owner/Admin, aber IMMER änderbar */}
        {(userRole === 'owner' || userRole === 'admin') && (
          <div className="mb-6">
            <label className="block text-gray-500 mb-1 font-semibold">Deadline (optional)</label>
            <input
              type="datetime-local"
              value={deadline ? deadline.slice(0, 16) : ''}
              onChange={e => setDeadline(e.target.value)}
              min={getMinDeadline()}
              className="mb-2 p-2 border rounded w-full"
            />
            <div className="flex gap-4 mt-1 flex-wrap items-center">
              <button
                type="button"
                onClick={() => { setDeadline(''); saveDeadline('') }}
                className="text-sm text-gray-500 underline"
                style={{ display: deadline ? 'inline' : 'none' }}
              >Deadline löschen</button>
              <button
                type="button"
                onClick={() => saveDeadline(deadline)}
                className="text-sm text-indigo-700 underline"
                disabled={!deadline}
              >Deadline speichern</button>
              {deadline && <span className="text-xs text-gray-400 ml-2">Aktuelle Deadline: {new Date(deadline).toLocaleString()}</span>}
              {!deadline && <span className="text-xs text-gray-400 ml-2">Keine Deadline gesetzt</span>}
              {isClosed && <span className="text-xs text-red-500 ml-4">Deadline abgelaufen – Bearbeitung gesperrt.</span>}
            </div>
            <hr className="my-4 border-gray-200 dark:border-gray-800" />
          </div>
        )}
        {/* Optionen */}
        <label className="block text-gray-500 mb-1 font-semibold">Optionen</label>
        <div className="space-y-2 mb-4">
          {options.map((opt, idx) => (
            <div key={opt.id || `opt-${opt.name}-${idx}`} className="flex gap-2 items-center">
              <input
                value={opt.name}
                onChange={e => handleOptionChange(idx, e.target.value)}
                placeholder={`Option ${idx + 1}`}
                className={`flex-1 p-2 border rounded ${dupClass(opt)}`}
                disabled={isClosed}
              />
              {opt._dup && (
                <span className="text-red-500 text-xs font-bold">Duplikat</span>
              )}
              <button type="button" className="text-red-500 text-xl" onClick={() => removeOption(idx)} title="Option löschen" disabled={isClosed}>×</button>
            </div>
          ))}
          <button type="button" onClick={addOption} className="mt-2 text-blue-600" disabled={isClosed}>+ Option hinzufügen</button>
        </div>
        {/* Kriterien */}
        <label className="block text-gray-500 mb-1 font-semibold mt-4">Kriterien <span className="text-gray-400 text-xs">(ohne Gewichtung!)</span></label>
        <div className="space-y-2">
          {criteria.map((c, idx) => (
            <div key={c.id || `crit-${c.name}-${idx}`} className="flex gap-2 items-center">
              <input
                value={c.name}
                onChange={e => handleCriterionChange(idx, 'name', e.target.value)}
                placeholder={`Kriterium ${idx + 1}`}
                className={`flex-1 p-2 border rounded ${dupClass(c)}`}
                disabled={isClosed}
              />
              <button type="button" className="text-red-500 text-xl ml-2" onClick={() => removeCriterion(idx)} title="Kriterium löschen" disabled={isClosed}>×</button>
            </div>
          ))}
          <button type="button" onClick={addCriterion} className="mt-2 text-blue-600" disabled={isClosed}>+ Kriterium hinzufügen</button>
        </div>
      </div>

      {/* Bewertung & Gewichtung */}
      <section className="mt-10">
        <TeamCriterionWeighting
          criteria={criteria}
          weights={weights}
          setWeights={setWeights}
          userRole={userRole}
          disabled={isClosed}
        />
      </section>
      <section className="mt-10">
        <EvaluateTeamDecision
          options={options}
          criteria={criteria}
          evaluations={evaluations}
          setEvaluations={setEvaluations}
          userRole={userRole}
          disabled={isClosed}
        />
      </section>

      {/* Nur noch EIN Save-Button */}
      <div className="mt-10 text-right">
        <button
          className="bg-indigo-600 text-white px-8 py-3 rounded-lg shadow font-semibold text-lg"
          onClick={handleSaveAll}
          disabled={
            isClosed ||
            options.some(o => o._dup) ||
            criteria.some(c => c._dup)
          }
        >
          💾 Alles speichern
        </button>
        {success && <div className="text-green-600 mt-2">{success}</div>}
        {error && <div className="text-red-600 mt-2">{error}</div>}
      </div>
    </div>
  )
}
