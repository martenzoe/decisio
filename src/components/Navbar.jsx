// src/components/Navbar.jsx
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import logo from '../assets/decisia-logo.png'
import { useState, useEffect } from 'react'

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved === 'dark'
  })
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.avatar-dropdown')) {
        setOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const toggleTheme = () => setDarkMode(prev => !prev)

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    navigate('/login')
  }

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/faq', label: 'FAQ' },
    { path: '/kontakt', label: 'Contact' },
  ]

  return (
    <nav className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src={logo} alt="Decisia Logo" className="h-11" />
        </div>

        {/* Navigation */}
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
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right: Toggle + Avatar Dropdown */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="text-gray-600 dark:text-gray-200 text-sm border border-gray-300 dark:border-gray-600 rounded-full px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            {darkMode ? '🌙 Dark' : '☀️ Light'}
          </button>

          <div className="relative avatar-dropdown">
            <button
              onClick={() => setOpen(!open)}
              className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs text-white font-bold"
            >
              U
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  👤 Profil bearbeiten
                </Link>
                <Link
                  to="/change-password"
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  🔐 Passwort ändern
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  🚪 Logout
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
