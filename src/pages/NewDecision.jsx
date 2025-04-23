import { useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { saveDecision } from '../lib/supabaseHelpers/saveDecision'
import { saveOptions } from '../lib/supabaseHelpers/saveOptions'
import { saveCriteria } from '../lib/supabaseHelpers/saveCriteria'
import { useNavigate } from 'react-router-dom'

function NewDecision() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [decisionName, setDecisionName] = useState('')
  const [description, setDescription] = useState('')
  const [mode, setMode] = useState('manual')
  const [options, setOptions] = useState([''])
  const [criteria, setCriteria] = useState([{ name: '', weight: '' }])

  const handleAddOption = () => setOptions([...options, ''])
  const handleAddCriterion = () => setCriteria([...criteria, { name: '', weight: '' }])

  const handleSubmit = async (e) => {
    e.preventDefault()

    const decision = await saveDecision({
      name: decisionName,
      description,
      mode,
      userId: user.id,
    })

    await saveOptions(options, decision.id)
    await saveCriteria(criteria, decision.id)

    navigate('/history')
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold">➕ Neue Entscheidung erstellen</h2>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Entscheidungsname */}
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

        {/* Beschreibung */}
        <div>
          <label className="block font-semibold">Beschreibung der Situation</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            rows={4}
            placeholder="Was möchtest du entscheiden? Wie ist deine Situation?"
            required
          />
        </div>

        {/* Bewertungsmethode */}
        <div>
          <label className="block font-semibold">Bewertungsmethode</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="manual">🧍 Manuell bewerten</option>
            <option value="ai">🤖 KI-Recherche & Bewertung</option>
          </select>
        </div>

        {/* Optionen */}
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
          <button type="button" onClick={handleAddOption} className="text-blue-600 underline text-sm">
            ➕ Weitere Option
          </button>
        </div>

        {/* Kriterien */}
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
          <button type="button" onClick={handleAddCriterion} className="text-blue-600 underline text-sm">
            ➕ Weiteres Kriterium
          </button>
        </div>

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Entscheidung speichern
        </button>
      </form>
    </div>
  )
}

export default NewDecision
