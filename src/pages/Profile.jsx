// src/pages/Profile.jsx
import { useEffect, useState } from 'react'
import AvatarUploader from '../components/AvatarUploader'
import { useAuthStore } from '../store/useAuthStore'
import { fetchProfile, saveProfile } from '../api/profile'

function Profile() {
  const { setUser } = useAuthStore()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await fetchProfile()
        console.log('👤 Profil geladen:', data)
        setForm(data)
      } catch (err) {
        console.error('❌ Fehler beim Laden des Profils:', err.message)
      }
    }

    loadProfile()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      await saveProfile(form)
      const fresh = await fetchProfile()
      setUser(fresh)
      console.log('✅ Profil gespeichert')
    } catch (err) {
      console.error('❌ Fehler beim Speichern:', err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!form) {
    return <div className="text-center text-white mt-10">Loading profile …</div>
  }

  return (
    <div className="flex justify-center mt-16">
      <div className="bg-gray-800 p-8 rounded-xl shadow-md w-full max-w-md text-white">
        <h2 className="text-2xl font-bold mb-6 text-center">Edit Profile</h2>
        <div className="flex justify-center mb-4">
          <AvatarUploader
            avatarUrl={form.avatar_url}
            onUpload={(url) => setForm((prev) => ({ ...prev, avatar_url: url }))}
          />
        </div>

        <label className="text-sm mb-1 block">Nickname</label>
        <input
          type="text"
          name="nickname"
          value={form.nickname || ''}
          maxLength={20}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
        />
        <p className="text-xs text-gray-400 text-right mt-1 mb-3">
          {(form.nickname || '').length}/20
        </p>

        <label className="text-sm mb-1 block">First Name</label>
        <input
          type="text"
          name="first_name"
          value={form.first_name || ''}
          onChange={handleChange}
          className="w-full mb-4 px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
        />

        <label className="text-sm mb-1 block">Last Name</label>
        <input
          type="text"
          name="last_name"
          value={form.last_name || ''}
          onChange={handleChange}
          className="w-full mb-4 px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
        />

        <label className="text-sm mb-1 block">Birthday</label>
        <input
          type="date"
          name="birthday"
          value={form.birthday || ''}
          onChange={handleChange}
          className="w-full mb-6 px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
        />

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}

export default Profile
