import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

function Logout() {
  const navigate = useNavigate()
  const { setUser } = useAuthStore()

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    navigate('/login')
  }

  return (
    <button onClick={handleLogout} className="text-red-600 underline">
      Logout
    </button>
  )
}

export default Logout
