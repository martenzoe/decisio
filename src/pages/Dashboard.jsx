import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { Link } from 'react-router-dom'
import { Lightbulb, BarChart2, FileText, Star, Activity } from 'lucide-react'
import { motion } from 'framer-motion'

function Dashboard() {
  const { user } = useAuthStore()
  const [allDecisions, setAllDecisions] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token')
      if (!token) return

      const res = await fetch('http://localhost:3000/api/decision', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()
      if (res.ok) {
        setAllDecisions(data)
      } else {
        console.error('Fehler beim Laden:', data.message)
      }
    }

    fetchData()
  }, [])

  const filtered = allDecisions.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="fixed inset-0 bg-[#A7D7C5] flex items-center justify-center overflow-hidden">
      <div className="absolute w-[900px] h-[900px] bg-[#C1E3D6] rounded-[160px] rotate-[-45deg] -left-[450px] top-1/2 -translate-y-1/2 opacity-50" />
      <div className="absolute w-[900px] h-[900px] bg-[#C1E3D6] rounded-[160px] rotate-[-45deg] -right-[450px] top-1/2 -translate-y-1/2 opacity-50" />

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 bg-[#F6FBF9] rounded-3xl shadow-2xl p-10 w-[90%] max-w-6xl space-y-6 overflow-y-auto max-h-[90vh]"
      >
        <h1 className="text-3xl font-bold text-[#212B27] text-center">🎯 Your Dashboard</h1>
        <p className="text-center text-[#32403B]">Make better decisions – with clarity & confidence.</p>

        {/* Search Bar */}
        <div className="flex justify-center">
          <input
            type="text"
            placeholder="🔎 Search decisions..."
            className="px-4 py-2 border border-gray-300 rounded-md w-full max-w-md text-sm focus:outline-none focus:ring-2 focus:ring-[#84C7AE]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow px-6 py-5 flex items-center gap-4">
            <BarChart2 className="text-[#84C7AE]" />
            <div>
              <p className="text-gray-600 text-sm">Total Decisions</p>
              <p className="text-xl font-bold text-[#212B27]">{allDecisions.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow px-6 py-5 flex items-center gap-4">
            <Activity className="text-[#84C7AE]" />
            <div>
              <p className="text-gray-600 text-sm">Recently Updated</p>
              <p className="text-sm text-[#32403B]">{allDecisions[0]?.name || '—'}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow px-6 py-5 flex items-center gap-4">
            <Lightbulb className="text-[#84C7AE]" />
            <div>
              <p className="text-gray-600 text-sm">Tip of the Day</p>
              <p className="text-sm text-[#32403B]">
                Choose what matters most – and let logic guide your values.
              </p>
            </div>
          </div>
        </div>

        {/* Filtered Decisions */}
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((d) => (
            <motion.div
              key={d.id}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl shadow px-6 py-5"
            >
              <div className="flex items-center gap-3 mb-2">
                <FileText className="text-[#84C7AE]" />
                <div>
                  <h3 className="font-bold text-lg text-[#212B27]">{d.name}</h3>
                  <p className="text-xs text-gray-500">Last edited: {new Date(d.created_at).toLocaleString()}</p>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                Description: <span className="font-semibold">{d.description || '—'}</span>
              </p>
              <p className="text-sm text-gray-700 mt-1">
                Mode: <span className="font-semibold">{d.mode}</span>
              </p>
              <Link
                to={`/decision/${d.id}`}
                className="inline-block mt-3 px-4 py-2 bg-[#84C7AE] hover:bg-[#6DB99F] text-white rounded-md text-sm font-semibold transition"
              >
                View Details
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col md:flex-row gap-4 justify-center mt-4">
          <Link
            to="/new-decision"
            className="bg-[#84C7AE] hover:bg-[#6DB99F] text-white font-bold px-6 py-3 rounded-lg text-center"
          >
            ➕ New Decision
          </Link>
          <Link
            to="/history"
            className="bg-white text-[#32403B] border border-[#84C7AE] font-bold px-6 py-3 rounded-lg text-center"
          >
            📁 View History
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default Dashboard
