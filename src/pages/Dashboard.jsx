import { useAuthStore } from '../store/useAuthStore'
import { Link } from 'react-router-dom'

function Dashboard() {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Willkommen zurück 👋</h2>
      <p className="text-gray-600">Eingeloggt als: <strong>{user?.email}</strong></p>

      <div className="mt-6 space-x-4">
        <Link to="/new-decision" className="bg-blue-600 text-white px-4 py-2 rounded">
          ➕ Neue Entscheidung starten
        </Link>
        <Link to="/history" className="text-blue-600 underline">
          📁 Meine Entscheidungen
        </Link>
      </div>
    </div>
  )
}

export default Dashboard
