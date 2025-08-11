import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useLanguageStore } from '../store/useLanguageStore'
import logo from '../assets/decisia-logo.png'
import defaultAvatar from '../assets/default-avatar.png'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, token, setUser } = useAuthStore()
  const { lang, toggleLang } = useLanguageStore()
  const { t, i18n } = useTranslation()

  useEffect(() => {
    i18n.changeLanguage(lang)
  }, [lang, i18n])

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark')
  const [open, setOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])

  const avatarUrl = user?.avatar_url || defaultAvatar
  const nickname = user?.nickname || 'User'

  // Anpassung: label ist jetzt ein Key (siehe JSON)
  const navItems = [
    { path: '/', label: 'navbar.home' },
    { path: '/dashboard', label: 'navbar.dashboard' },
    { path: '/faq', label: 'navbar.faq' },
    { path: '/kontakt', label: 'navbar.contact' }
  ]

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.avatar-dropdown')) setOpen(false)
      if (!e.target.closest('.notif-dropdown')) setNotifOpen(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const toggleTheme = () => setDarkMode((prev) => !prev)

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    navigate('/login')
  }

  const fetchNotifications = async () => {
    if (!token) return
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const result = await res.json()

      if (Array.isArray(result)) {
        setNotifications(result)
      } else {
        setNotifications([])
      }
    } catch (err) {
      setNotifications([])
    }
  }

  const handleAccept = async (id, link) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchNotifications()
      if (link) navigate(link)
    } catch (err) {}
  }

  useEffect(() => {
    if (user && token) fetchNotifications()
  }, [user, token])

  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n) => !n.read).length
    : 0

  return (
    <nav className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Decisia Logo" className="h-11" />
        </div>

        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium transition ${
                location.pathname === item.path
                  ? 'text-[#4F46E5] dark:text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:text-[#4F46E5]'
              }`}
            >
              {t(item.label)}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <button
            onClick={toggleLang}
            className="px-2 py-1 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition focus:outline-none"
            aria-label={t('navbar.switchLang')}
          >
            {lang === 'en' ? 'DE' : 'EN'}
          </button>

          {/* Dark Mode Button */}
          <button
            onClick={toggleTheme}
            className="text-gray-600 dark:text-gray-200 text-sm border border-gray-300 dark:border-gray-600 rounded-full px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            {darkMode ? `🌙 ${t('navbar.dark')}` : `☀️ ${t('navbar.light')}`}
          </button>

          {/* Glocke */}
          <div className="relative notif-dropdown">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative text-gray-600 dark:text-gray-200"
              aria-label={t('navbar.notifications')}
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setNotifOpen(false)
                      navigate('/notifications')
                    }}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    🔍 {t('navbar.seeAllNotifications')}
                  </button>
                </div>

                {notifications.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 dark:text-gray-300">
                    {t('navbar.noNotifications')}
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="px-4 py-2 border-b border-gray-100 dark:border-gray-700"
                    >
                      <p className="text-sm text-gray-800 dark:text-gray-100">{n.message}</p>
                      {!n.read && (
                        <button
                          onClick={() => handleAccept(n.id, n.link)}
                          className="mt-1 text-xs text-blue-600 hover:underline"
                        >
                          {t('navbar.accept')}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="relative avatar-dropdown">
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 rounded-full focus:outline-none"
              aria-label={t('navbar.profileMenu')}
            >
              <span className="text-sm font-medium text-gray-800 dark:text-white hidden md:block">
                {nickname}
              </span>
              <img
                src={avatarUrl}
                alt="avatar"
                className="w-8 h-8 rounded-full border border-gray-300"
              />
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  👤 {t('navbar.editProfile')}
                </Link>
                <Link
                  to="/change-password"
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  🔐 {t('navbar.changePassword')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  🚪 {t('navbar.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
