import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

// Hilfsfunktionen für Validierung
function hasDuplicates(array) {
  return new Set(array).size !== array.length
}
function isEmptyOrWhitespace(str) {
  return !str || !str.trim()
}

function NewTeamDecision() {
  const [decisionName, setDecisionName] = useState('')
  const [description, setDescription] = useState('')
  const [mode, setMode] = useState('manual')
  const [timer, setTimer] = useState('')
  const [options, setOptions] = useState([''])
  const [criteria, setCriteria] = useState([''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)

  useEffect(() => {
    if (!token) navigate('/login')
  }, [token, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Nur Name ist Pflicht!
    if (!decisionName) {
      setError('Bitte gib einen Titel ein.')
      return
    }

    setLoading(true)

    try {
      // Team-Entscheidung anlegen (Basisdaten, importance gibt es nicht mehr!)
      const basePayload = {
        name: decisionName,
        description,
        mode,
        timer,
        type: 'team',
        options: options.filter(o => !isEmptyOrWhitespace(typeof o === 'string' ? o : o?.name)).map(o =>
          typeof o === 'string' ? { name: o } : { name: o.name }
        ),
        criteria: criteria.filter(isEmptyOrWhitespace).length === criteria.length
          ? []
          : criteria.filter(c => !isEmptyOrWhitespace(c)).map(name => ({ name }))
      }

      const res = await fetch('/api/team-decisions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(basePayload)
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Unbekannter Fehler')
      const { decision } = result
      if (!decision?.id) throw new Error('❌ Keine gültige Decision-ID erhalten')
      const decisionId = decision.id

      // Weiter zu Einladungen
      navigate(`/team-invite/${decisionId}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOptionChange = (idx, value) => {
    const updated = [...options]
    updated[idx] = value
    setOptions(updated)
  }

  const handleCriterionChange = (idx, value) => {
    const updated = [...criteria]
    updated[idx] = value
    setCriteria(updated)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-100 shadow-2xl rounded-2xl p-8 space-y-10">
        <h1 className="text-3xl font-bold">Neue Team-Entscheidung</h1>
        <div className="bg-blue-900/90 text-white rounded px-4 py-3 mb-6 text-sm">
          <b>Hinweis:</b> Optionen, Kriterien und Deadline sind optional. Bewertungen und Gewichtungen werden erst nach Anlage über <b>"Bearbeiten"</b> erfasst – auch für den Admin.
        </div>
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input value={decisionName} onChange={(e) => setDecisionName(e.target.value)} placeholder="Titel (Pflichtfeld)" className="p-3 border rounded-lg" />
            <input type="datetime-local" value={timer} onChange={(e) => setTimer(e.target.value)} className="p-3 border rounded-lg" />
            <select value={mode} onChange={(e) => setMode(e.target.value)} className="p-3 border rounded-lg">
              <option value="manual">Manuell</option>
              <option value="ai">KI-Modus</option>
            </select>
          </div>

          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Beschreibung (optional)" className="w-full p-3 border rounded-lg" rows={3} />

          {/* Optionen */}
          <div>
            <h2 className="text-lg font-semibold">Optionen <span className="text-gray-400 text-base">(optional)</span></h2>
            {options.map((opt, idx) => (
              <div key={idx} className="flex gap-2 mt-2">
                <input value={typeof opt === 'string' ? opt : opt.name || ''} onChange={(e) => handleOptionChange(idx, e.target.value)} placeholder={`Option ${idx + 1}`} className="flex-1 p-2 border rounded" />
                <button type="button" onClick={() => setOptions(options.filter((_, i) => i !== idx))}>X</button>
              </div>
            ))}
            <button type="button" onClick={() => setOptions([...options, ''])} className="mt-2 text-blue-600">+ Option</button>
          </div>

          {/* Kriterien */}
          <div>
            <h2 className="text-lg font-semibold">Kriterien <span className="text-gray-400 text-base">(optional)</span></h2>
            {criteria.map((c, idx) => (
              <div key={idx} className="flex gap-2 mt-2">
                <input value={c} onChange={(e) => handleCriterionChange(idx, e.target.value)} placeholder="Kriterium" className="flex-1 p-2 border rounded" />
                <button type="button" onClick={() => setCriteria(criteria.filter((_, i) => i !== idx))}>X</button>
              </div>
            ))}
            <button type="button" onClick={() => setCriteria([...criteria, ''])} className="mt-2 text-blue-600">+ Kriterium</button>
          </div>

          {error && (
            <div className="text-red-600 bg-red-50 border border-red-200 p-3 rounded">
              {error}
            </div>
          )}

          <div className="text-right">
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow font-semibold">
              {loading ? 'Speichern …' : 'Weiter zu Einladungen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewTeamDecision
