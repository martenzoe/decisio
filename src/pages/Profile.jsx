import { useEffect, useState } from 'react'
import { getProfile, updateProfile } from '../api/profile'
import AvatarUploader from '../components/AvatarUploader'

function Profile() {
  const [nickname, setNickname] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      const data = await getProfile()
      if (data) {
        setNickname(data.nickname || '')
        setAvatarUrl(data.avatar_url || '')
      }
      setLoading(false)
    }
    fetchProfile()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    await updateProfile({ nickname, avatar_url: avatarUrl })
    setLoading(false)
    alert('✅ Profil aktualisiert')
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🧑 Profil bearbeiten</h1>

      <label className="block mb-2 text-sm font-medium">Nickname *</label>
      <input
        type="text"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />

      <label className="block mb-2 text-sm font-medium">Profilbild</label>
      <AvatarUploader avatarUrl={avatarUrl} setAvatarUrl={setAvatarUrl} />

      <button
        onClick={handleSave}
        disabled={loading}
        className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {loading ? 'Speichern ...' : 'Speichern'}
      </button>
    </div>
  )
}

export default Profile
