import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

function EditDecision() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [mode, setMode] = useState('manual')
  const [type, setType] = useState('private')
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDecision = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/decision/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load decision')
        setName(data.name)
        setDescription(data.description)
        setMode(data.mode)
        setType(data.type)
      } catch (err) {
        setError(err.message)
      }
    }

    fetchDecision()
  }, [id, user.token])

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`http://localhost:3000/api/decision/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ name, description, mode, type }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Update failed')
      }

      navigate(`/decision/${id}`)
    } catch (err) {
      alert(`❌ Error: ${err.message}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-6 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">✏️ Edit Decision</h2>

        {error && <p className="text-red-600">{error}</p>}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block font-medium text-gray-800 dark:text-gray-200">Title</label>
            <input
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block font-medium text-gray-800 dark:text-gray-200">Description</label>
            <textarea
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block font-medium text-gray-800 dark:text-gray-200">Mode</label>
              <select
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded"
                value={mode}
                onChange={e => setMode(e.target.value)}
              >
                <option value="manual">Manual</option>
                <option value="ai">AI</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block font-medium text-gray-800 dark:text-gray-200">Type</label>
              <select
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded"
                value={type}
                onChange={e => setType(e.target.value)}
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            💾 Save changes
          </button>
        </form>
      </div>
    </div>
  )
}

export default EditDecision
