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
    <div className="max-w-6xl mx-auto px-4 py-16 space-y-12">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">📊 Your decisions</h2>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              You have created <strong>{filtered.length}</strong> decisions.
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/new-decision')}
              className="bg-[#4F46E5] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#4338CA] transition"
            >
              ➕ New Decision
            </button>
            <button
              onClick={() => navigate('/new-team-decision')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition"
            >
              🤝 New Team Decision
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <input
            type="text"
            placeholder="🔍 Search by title..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm w-full sm:w-1/2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
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
                className={`px-3 py-1 rounded-md text-sm font-medium border transition ${
                  filter === btn.key
                    ? 'bg-[#4F46E5] text-white'
                    : 'bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'
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
              className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 shadow-sm flex flex-col justify-between"
            >
              <div>
                <h3 className="font-semibold text-lg text-gray-800 dark:text-white">{d.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{d.description}</p>
                <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">
                  Mode: {d.mode === 'manual' ? '🧠 Manual' : '🤖 AI'}
                </p>
                {d.score && (
                  <p className="text-sm font-semibold text-right text-green-700 dark:text-green-400 mt-1">
                    Score: {d.score}
                  </p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-300 mt-3">
                  Created: {new Date(d.created_at).toLocaleDateString()}<br />
                  Updated: {new Date(d.updated_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-3 mt-4 text-sm">
                <button
                  onClick={() => navigate(`/decision/${d.id}`)}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Details
                </button>
                <button
                  onClick={() => navigate(`/decision/${d.id}/edit`)}
                  className="text-yellow-600 dark:text-yellow-400 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(d.id)}
                  className="text-red-600 dark:text-red-400 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
