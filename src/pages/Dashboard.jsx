// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

function Dashboard() {
  const { user } = useAuthStore()
  const [decisions, setDecisions] = useState([])
  const [filtered, setFiltered] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('latest')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchDecisions = async () => {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:3000/api/decision', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setDecisions(data)
      setFiltered(data)
    }
    fetchDecisions()
  }, [])

  useEffect(() => {
    let result = [...decisions]

    if (searchTerm) {
      result = result.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filter === 'manual') {
      result = result.filter(d => d.mode === 'manual')
    } else if (filter === 'ai') {
      result = result.filter(d => d.mode === 'ai')
    } else if (filter === 'score') {
      result.sort((a, b) => (b.score || 0) - (a.score || 0))
    } else {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }

    setFiltered(result)
  }, [searchTerm, filter, decisions])

  const handleDelete = async (id) => {
    if (!window.confirm('Wirklich löschen?')) return
    const token = localStorage.getItem('token')
    await fetch(`http://localhost:3000/api/decision/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setDecisions(prev => prev.filter(d => d.id !== id))
  }

  return (
    <div className="min-h-screen bg-[#A7D7C5] py-10 px-4">
      <div className="bg-white p-6 rounded-2xl shadow-md max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">📊 Deine Entscheidungen</h2>
          <button
            onClick={() => navigate('/new-decision')}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            ➕ Neue Entscheidung
          </button>
        </div>

        <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
          <input
            type="text"
            placeholder="🔍 Suche nach Titel..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="p-2 border rounded w-full sm:w-1/2"
          />
          <div className="flex gap-2 mt-2 sm:mt-0">
            <button onClick={() => setFilter('latest')} className="text-sm bg-gray-200 px-2 py-1 rounded">Neuste</button>
            <button onClick={() => setFilter('score')} className="text-sm bg-gray-200 px-2 py-1 rounded">Höchster Score</button>
            <button onClick={() => setFilter('manual')} className="text-sm bg-gray-200 px-2 py-1 rounded">Manuell</button>
            <button onClick={() => setFilter('ai')} className="text-sm bg-gray-200 px-2 py-1 rounded">KI</button>
          </div>
        </div>

        <div className="mb-6 text-sm text-gray-600">
          Du hast insgesamt <strong>{filtered.length}</strong> Entscheidungen getroffen.
        </div>

        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <div key={d.id} className="bg-green-100 rounded-xl p-4 shadow">
              <h3 className="font-semibold text-lg">{d.name}</h3>
              <p className="text-sm text-gray-700">{d.description}</p>
              <p className="text-sm mt-2">Modus: {d.mode === 'manual' ? '🧠 Manuell' : '🤖 KI'}</p>
              {d.score && (
                <p className="text-sm font-bold text-right text-green-800">Score: {d.score}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Erstellt: {new Date(d.created_at).toLocaleDateString()}<br />
                Geändert: {new Date(d.updated_at).toLocaleDateString()}
              </p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => navigate(`/decision/${d.id}`)} className="text-blue-600 underline">Details</button>
                <button onClick={() => navigate(`/decision/${d.id}/edit`)} className="text-yellow-600 underline">Bearbeiten</button>
                <button onClick={() => handleDelete(d.id)} className="text-red-600 underline">Löschen</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
