import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

function EditDecision() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [decisionName, setDecisionName] = useState('')
  const [options, setOptions] = useState([])
  const [criteria, setCriteria] = useState([])

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: decisionData } = await supabase
        .from('decisions')
        .select('*')
        .eq('id', id)
        .single()

      const { data: optionsData } = await supabase
        .from('options')
        .select('*')
        .eq('decision_id', id)

      const { data: criteriaData } = await supabase
        .from('criteria')
        .select('*')
        .eq('decision_id', id)

      setDecisionName(decisionData.name)
      setOptions(optionsData.map(o => o.name))
      setCriteria(criteriaData.map(c => ({ name: c.name, weight: c.weight })))
      setLoading(false)
    }

    fetchData()
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      // Entscheidung aktualisieren
      await supabase
        .from('decisions')
        .update({ name: decisionName })
        .eq('id', id)

      // Optionen & Kriterien löschen und neu einfügen
      await supabase.from('options').delete().eq('decision_id', id)
      await supabase.from('criteria').delete().eq('decision_id', id)

      const newOptions = options.map(name => ({ name, decision_id: id }))
      const newCriteria = criteria.map(c => ({
        name: c.name,
        weight: Number(c.weight),
        decision_id: id
      }))

      await supabase.from('options').insert(newOptions)
      await supabase.from('criteria').insert(newCriteria)

      alert('✅ Entscheidung aktualisiert')
      navigate('/history')
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren:', error)
      alert('Fehler beim Speichern. Siehe Konsole.')
    }
  }

  const handleAddOption = () => setOptions([...options, ''])
  const handleAddCriterion = () => setCriteria([...criteria, { name: '', weight: '' }])

  if (loading) return <p className="p-4">⏳ Lädt...</p>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">✏️ Entscheidung bearbeiten</h2>

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

        <div>
          <label className="block font-semibold">Kriterien</label>
          {criteria.map((criterion, index) => (
            <div key={index} className="flex space-x-2 mb-2">
              <input
                type="text"
                value={criterion.name}
                onChange={(e) => {
                  const newCriteria = [...criteria]
                  newCriteria[index].name = e.target.value
                  setCriteria(newCriteria)
                }}
                placeholder={`Kriterium ${index + 1}`}
                className="flex-1 border px-3 py-2 rounded"
                required
              />
              <input
                type="number"
                value={criterion.weight}
                onChange={(e) => {
                  const newCriteria = [...criteria]
                  newCriteria[index].weight = e.target.value
                  setCriteria(newCriteria)
                }}
                placeholder="Gewichtung"
                className="w-24 border px-3 py-2 rounded"
                required
              />
            </div>
          ))}
              <button type="button" onClick={handleAddCriterion} className="text-blue-600 underline text-sm">
                ➕ Weiteres Kriterium
              </button>
            </div>
          </form>
        </div>
      )
    }
    export default EditDecision
