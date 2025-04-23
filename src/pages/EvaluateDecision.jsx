import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

function EvaluateDecision() {
  const { id } = useParams()

  const [decision, setDecision] = useState(null)
  const [options, setOptions] = useState([])
  const [criteria, setCriteria] = useState([])
  const [scores, setScores] = useState({})
  const [loading, setLoading] = useState(true)

  // Daten laden
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

      // Vorhandene Bewertungen laden
      const { data: evaluationsData } = await supabase
        .from('evaluations')
        .select('*')
        .in('option_id', optionsData.map((o) => o.id))

      const scoreMap = {}

      evaluationsData?.forEach((evalItem) => {
        scoreMap[`${evalItem.option_id}_${evalItem.criterion_id}`] = evalItem.score
      })

      setDecision(decisionData)
      setOptions(optionsData)
      setCriteria(criteriaData)
      setScores(scoreMap)
      setLoading(false)
    }

    fetchData()
  }, [id])

  // Score ändern
  const handleScoreChange = (optionId, criterionId, value) => {
    const key = `${optionId}_${criterionId}`
    setScores((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // Bewertungen speichern
  const handleSave = async () => {
    const entries = Object.entries(scores)

    const payload = entries.map(([key, value]) => {
      const [optionId, criterionId] = key.split('_')
      return {
        option_id: optionId,
        criterion_id: criterionId,
        score: Number(value),
      }
    })

    // Alte Bewertungen löschen, neue einfügen
    await supabase.from('evaluations').delete().in('option_id', options.map((o) => o.id))
    const { error } = await supabase.from('evaluations').insert(payload)

    if (error) {
      console.error('❌ Fehler beim Speichern:', error)
      alert('Fehler beim Speichern!')
    } else {
      alert('✅ Bewertungen gespeichert!')
    }
  }

  if (loading) return <p className="p-4">⏳ Lädt...</p>
  if (!decision) return <p className="p-4">❌ Entscheidung nicht gefunden.</p>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">🧮 Bewertung: {decision.name}</h2>

      <div className="overflow-x-auto">
        <table className="w-full border mt-4 text-sm">
          <thead>
            <tr>
              <th className="border px-3 py-2 text-left bg-gray-100">Option \ Kriterium</th>
              {criteria.map((crit) => (
                <th key={crit.id} className="border px-3 py-2 text-left bg-gray-100">
                  {crit.name} ({crit.weight}%)
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {options.map((opt) => (
              <tr key={opt.id}>
                <td className="border px-3 py-2 font-medium bg-gray-50">{opt.name}</td>
                {criteria.map((crit) => {
                  const key = `${opt.id}_${crit.id}`
                  return (
                    <td key={key} className="border px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={scores[key] || ''}
                        onChange={(e) =>
                          handleScoreChange(opt.id, crit.id, e.target.value)
                        }
                        className="w-16 px-2 py-1 border rounded"
                        placeholder="0–10"
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleSave}
        className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
      >
        💾 Bewertungen speichern
      </button>
    </div>
  )
}

export default EvaluateDecision
