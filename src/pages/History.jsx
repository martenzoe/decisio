import { useEffect, useState } from 'react'
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
      <h2 className="text-2xl font-bold">📁 My Decisions</h2>

      {loading && <p>Loading your saved decisions...</p>}

      {!loading && decisions.length === 0 && (
        <p className="text-gray-600">You have not saved any decisions yet.</p>
      )}

      {!loading && decisions.length > 0 && (
        <ul className="space-y-4">
          {decisions.map((d) => (
            <li key={d.id} className="border p-4 rounded shadow-sm bg-white">
              <h3 className="text-xl font-semibold">{d.name}</h3>
              <p className="text-sm text-gray-500">Created on {new Date(d.created_at).toLocaleString()}</p>
              <Link
                to={`/decision/${d.id}`}
                className="text-blue-600 underline text-sm"
              >
                🔍 View Details
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default History
