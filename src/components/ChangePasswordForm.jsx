import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function ChangePasswordForm() {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const handleChangePassword = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')

    try {
      const res = await fetch('https://decisio.onrender.com/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      })

      const data = await res.json()
      if (res.ok) {
        setMessage('✅ Passwort wurde erfolgreich geändert.')
        setOldPassword('')
        setNewPassword('')
      } else {
        setMessage(data.error || '❌ Fehler beim Ändern des Passworts.')
      }
    } catch {
      setMessage('❌ Serverfehler.')
    }
  }

  return (
    <form onSubmit={handleChangePassword} className="space-y-4">
      <label className="block">
        Aktuelles Passwort:
        <input
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          required
          className="w-full mt-1 p-2 border rounded"
        />
      </label>
      <label className="block">
        Neues Passwort:
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className="w-full mt-1 p-2 border rounded"
        />
      </label>
      <button
        type="submit"
        className="bg-[#4F46E5] text-white px-4 py-2 rounded hover:bg-[#4338CA]"
      >
        Speichern
      </button>
      <p
        onClick={() => navigate('/forgot-password')}
        className="text-sm text-blue-600 cursor-pointer hover:underline"
      >
        Passwort vergessen?
      </p>
      {message && <p className="text-sm text-gray-700 mt-2">{message}</p>}
    </form>
  )
}

export default ChangePasswordForm
