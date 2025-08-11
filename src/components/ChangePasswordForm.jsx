// src/components/ChangePasswordForm.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

function ChangePasswordForm() {
  const { t } = useTranslation('translation', { keyPrefix: 'changePassword' })
  const navigate = useNavigate()

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')

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
        setMessage(t('success'))
        setOldPassword('')
        setNewPassword('')
      } else {
        setMessage(data.error || t('error'))
      }
    } catch {
      setMessage(t('serverError'))
    }
  }

  return (
    <form onSubmit={handleChangePassword} className="space-y-4">
      <label className="block">
        {t('current')}
        <input
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          required
          className="w-full mt-1 p-2 border rounded"
        />
      </label>
      <label className="block">
        {t('new')}
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
        {t('save')}
      </button>
      <p
        onClick={() => navigate('/forgot-password')}
        className="text-sm text-blue-600 cursor-pointer hover:underline"
      >
        {t('forgot')}
      </p>
      {message && <p className="text-sm text-gray-700 mt-2">{message}</p>}
    </form>
  )
}

export default ChangePasswordForm
