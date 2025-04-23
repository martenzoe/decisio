import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuthStore } from '../store/useAuthStore'
import { Link } from 'react-router-dom'

function History() {
  const user = useAuthStore((state) => state.user)
  const [decisions, setDecisions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDecisions = async () => {
      const { data, error } = await supabase
        .from('decisions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Fehler beim Laden der Entscheidungen:', error)
      } else {
        setDecisions(data)
      }
      setLoading(false)
    }

    fetchDecisions()
  }, [user])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">📁 Meine Entscheidungen</h2>

      {loading && <p>Lade deine gespeicherten Entscheidungen...</p>}

      {!loading && decisions.length === 0 && (
        <p className="text-gray-600">Du hast noch keine Entscheidungen gespeichert.</p>
      )}

      {!loading && decisions.length > 0 && (
        <ul className="space-y-4">
          {decisions.map((d) => (
            <li key={d.id} className="border p-4 rounded shadow-sm bg-white">
              <h3 className="text-xl font-semibold">{d.name}</h3>
              <p className="text-sm text-gray-500">Erstellt am {new Date(d.created_at).toLocaleString()}</p>
              <Link
                to={`/decision/${d.id}`}
                className="text-blue-600 underline text-sm"
              >
                🔍 Details ansehen
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default History
