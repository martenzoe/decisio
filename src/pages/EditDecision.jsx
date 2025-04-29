import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { updateDecision } from '../lib/supabaseHelpers/updateDecision'

function EditDecision() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [decision, setDecision] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [mode, setMode] = useState('manual')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDecision = async () => {
      const { data, error } = await supabase
        .from('decisions')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('❌ Fehler beim Laden der Entscheidung:', error)
      } else {
        setDecision(data)
        setName(data.name)
        setDescription(data.description || '')
        setMode(data.mode || 'manual')
      }
      setLoading(false)
    }

    fetchDecision()
  }, [id])

  const handleUpdate = async (e) => {
    e.preventDefault()

    try {
      await updateDecision(id, { name, description, mode })
      alert('✅ Entscheidung aktualisiert!')
      navigate(`/decision/${id}`) // zurück zur Detailansicht
    } catch (error) {
      console.error(error)
      alert('❌ Fehler beim Aktualisieren!')
    }
  }

  if (loading) return <p className="p-4">⏳ Lädt...</p>
  if (!decision) return <p className="p-4">❌ Entscheidung nicht gefunden.</p>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">✏️ Entscheidung bearbeiten</h2>

      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="block font-semibold">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block font-semibold">Beschreibung (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <div>
          <label className="block font-semibold">Bewertungsmethode</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="manual">Manuell</option>
            <option value="ai">KI-gestützt</option>
          </select>
        </div>

        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
          💾 Entscheidung speichern
        </button>
      </form>
    </div>
  )
}

export default EditDecision
