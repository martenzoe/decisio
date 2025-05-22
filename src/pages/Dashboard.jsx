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
    if (!window.confirm('Are you sure you want to delete this decision?')) return
    const token = localStorage.getItem('token')
    await fetch(`http://localhost:3000/api/decision/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setDecisions(prev => prev.filter(d => d.id !== id))
  }

  return (
    <div className="min-h-screen bg-white relative">
      {/* Header Background */}
      <div className="absolute top-0 left-0 w-full h-64 bg-[#4F46E5] z-0" />

      <div className="relative z-10 py-12 px-4 max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">📊 Your decisions</h2>
              <p className="text-sm text-gray-500">
                You have created <strong>{filtered.length}</strong> decisions.
              </p>
            </div>
            <button
              onClick={() => navigate('/new-decision')}
              className="bg-[#4F46E5] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#4338CA] transition"
            >
              ➕ New Decision
            </button>
          </div>

          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <input
              type="text"
              placeholder="🔍 Search by title..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="p-2 border border-gray-300 rounded-md shadow-sm w-full sm:w-1/2"
            />
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'latest', label: 'Newest' },
                { key: 'score', label: 'Highest Score' },
                { key: 'manual', label: 'Manual' },
                { key: 'ai', label: 'AI' },
              ].map(btn => (
                <button
                  key={btn.key}
                  onClick={() => setFilter(btn.key)}
                  className={`px-3 py-1 rounded-md text-sm font-medium border ${
                    filter === btn.key
                      ? 'bg-[#4F46E5] text-white'
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((d) => (
              <div
                key={d.id}
                className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">{d.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{d.description}</p>
                  <p className="text-sm mt-2 text-gray-500">
                    Mode: {d.mode === 'manual' ? '🧠 Manual' : '🤖 AI'}
                  </p>
                  {d.score && (
                    <p className="text-sm font-semibold text-right text-green-700 mt-1">
                      Score: {d.score}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-3">
                    Created: {new Date(d.created_at).toLocaleDateString()}<br />
                    Updated: {new Date(d.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-3 mt-4 text-sm">
                  <button
                    onClick={() => navigate(`/decision/${d.id}`)}
                    className="text-blue-600 hover:underline"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => navigate(`/decision/${d.id}/edit`)}
                    className="text-yellow-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
