// src/components/Navbar.jsx
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import logo from '../assets/decisia-logo.png'

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { setUser } = useAuthStore()

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    navigate('/login')
  }

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/faq', label: 'FAQ' },
    { path: '/kontakt', label: 'Kontakt' },
  ]

  return (
    <nav className="bg-white shadow-md px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <img src={logo} alt="Logo" className="h-8" />
      </div>
      <div className="flex items-center gap-6">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`text-sm font-medium hover:underline ${
              location.pathname === item.path ? 'text-[#84C7AE]' : 'text-[#32403B]'
            }`}
          >
            {item.label}
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="text-sm font-medium text-red-600 hover:underline"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}

export default Navbar
