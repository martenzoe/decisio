import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function NotificationsPage() {
  const { token, user, setUnreadNotifications } = useAuthStore()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  // Nach Aufruf: als gelesen markieren und Counter im Store auf 0 setzen
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Fehler beim Laden der Benachrichtigungen')
        setNotifications(data)

        // Alle ungelesenen direkt als gelesen markieren
        const unread = data.filter(n => !n.read)
        if (unread.length > 0) {
          await Promise.all(unread.map(n =>
            fetch(`/api/notifications/${n.id}/read`, {
              method: 'PUT',
              headers: { Authorization: `Bearer ${token}` },
            })
          ))
          // Counter im Store auf 0 setzen
          setUnreadNotifications && setUnreadNotifications(0)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (token) fetchNotifications()
  }, [token, setUnreadNotifications])

  // Zeigt den Button NUR, wenn User Empfänger ist (user.id === n.user_id) UND nicht der Einladende
  function showAcceptButton(n) {
    if (!user?.id) return false
    if (n.read) return false
    if (!n.message?.toLowerCase().includes('eingeladen')) return false
    if (user.id !== n.user_id) return false // Empfänger-Check
    if (user.id === n.inviter_id) return false // Nicht für Einladenden
    return true
  }

  // Annahme (Benachrichtigung als gelesen und ggf. zum Link)
  const handleAccept = async (notification) => {
    await fetch(`/api/notifications/${notification.id}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    })
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    )
    if (notification.link) navigate(notification.link)
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">
      <Navbar />

      <main className="flex-grow max-w-3xl w-full mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Notifications</h1>

        {loading && <p>⏳ Loading ...</p>}
        {error && <p className="text-red-600">❌ {error}</p>}

        {notifications.length === 0 && !loading && (
          <p className="text-gray-500 dark:text-gray-400">No notifications</p>
        )}

        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {notifications.map((n) => (
            <li key={n.id} className="py-4 flex justify-between items-start gap-4">
              <div>
                <p className="text-sm">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
              {showAcceptButton(n) && (
                <button
                  onClick={() => handleAccept(n)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Accept
                </button>
              )}
            </li>
          ))}
        </ul>
      </main>

      <Footer />
    </div>
  )
}

export default NotificationsPage
