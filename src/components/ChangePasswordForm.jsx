import { useState } from 'react'

function ChangePasswordForm() {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleChangePassword = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('http://localhost:3000/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword: password }),
      })

      const data = await res.json()
      if (res.ok) {
        setMessage('Passwort erfolgreich geändert.')
      } else {
        setMessage(data.error || 'Fehler beim Ändern des Passworts.')
      }
    } catch (error) {
      setMessage('Serverfehler.')
    }
  }

  return (
    <form onSubmit={handleChangePassword} className="space-y-4">
      <label className="block">
        Neues Passwort:
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
      {message && <p className="text-sm text-gray-700 mt-2">{message}</p>}
    </form>
  )
}

export default ChangePasswordForm
