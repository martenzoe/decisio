// src/pages/NewDecision.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function NewDecision() {
  const [decisionName, setDecisionName] = useState('')
  const [description, setDescription] = useState('')
  const [mode, setMode] = useState('manual')
  const [type, setType] = useState('private') // NEU
  const [options, setOptions] = useState([''])
  const [criteria, setCriteria] = useState([{ name: '', weight: '' }])
  const navigate = useNavigate()

  const handleAddOption = () => setOptions([...options, ''])
  const handleAddCriterion = () =>
    setCriteria([...criteria, { name: '', weight: '' }])

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('⛔ Kein Token gefunden')

      // 1. Entscheidung speichern
      const res = await fetch('http://localhost:3000/api/decision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: decisionName, description, mode, type }), // ✅ type hinzugefügt
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      const decisionId = data.id

      // 2. Optionen speichern
      await fetch(`http://localhost:3000/api/decision/${decisionId}/options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ options }),
      })

      // 3. Kriterien speichern
      await fetch(`http://localhost:3000/api/decision/${decisionId}/criteria`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ criteria }),
      })

      alert('✅ Entscheidung gespeichert!')
      navigate('/dashboard')
    } catch (err) {
      console.error('❌ Fehler:', err.message)
      alert('❌ Fehler beim Speichern der Entscheidung')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold">➕ Neue Entscheidung erstellen</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold">Entscheidungsname</label>
          <input
            type="text"
            value={decisionName}
            onChange={(e) => setDecisionName(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block font-semibold">Beschreibung</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            rows="3"
            placeholder="Beschreibe dein Entscheidungsproblem"
          />
        </div>

        <div>
          <label className="block font-semibold">Modus</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="manual">Manuelle Entscheidung</option>
            <option value="ai">KI-gestützte Entscheidung</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold">Entscheidungstyp</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="private">Privat</option>
            <option value="public">Öffentlich</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold">Optionen</label>
          {options.map((option, index) => (
            <input
              key={index}
              type="text"
              value={option}
              onChange={(e) => {
                const newOptions = [...options]
                newOptions[index] = e.target.value
                setOptions(newOptions)
              }}
              placeholder={`Option ${index + 1}`}
              className="w-full border px-3 py-2 rounded mb-2"
              required
            />
          ))}
          <button
            type="button"
            onClick={handleAddOption}
            className="text-blue-600 underline text-sm"
          >
            ➕ Weitere Option
          </button>
        </div>

        <div>
          <label className="block font-semibold">Kriterien mit Gewichtung (%)</label>
          {criteria.map((criterion, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder={`Kriterium ${index + 1}`}
                value={criterion.name}
                onChange={(e) => {
                  const newCriteria = [...criteria]
                  newCriteria[index].name = e.target.value
                  setCriteria(newCriteria)
                }}
                className="flex-1 border px-3 py-2 rounded"
                required
              />
              <input
                type="number"
                placeholder="Gewicht"
                value={criterion.weight}
                onChange={(e) => {
                  const newCriteria = [...criteria]
                  newCriteria[index].weight = e.target.value
                  setCriteria(newCriteria)
                }}
                className="w-24 border px-3 py-2 rounded"
                required
              />
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddCriterion}
            className="text-blue-600 underline text-sm"
          >
            ➕ Weiteres Kriterium
          </button>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Entscheidung speichern
        </button>
      </form>
    </div>
  )
}

export default NewDecision
