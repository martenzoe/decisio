import { useState } from 'react'
import { CameraIcon } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'

function AvatarUploader({ avatarUrl, onUpload }) {
  const { token } = useAuthStore()
  const [preview, setPreview] = useState(avatarUrl || '')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)

    try {
      // lokale Vorschau
      const reader = new FileReader()
      reader.onload = () => setPreview(String(reader.result))
      reader.readAsDataURL(file)

      const form = new FormData()
      form.append('file', file)

      const res = await fetch('/api/users/avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Upload failed')

      // neue URL nach oben durchreichen
      onUpload?.(json.url)
    } catch (err) {
      console.error('❌ Avatar upload failed:', err)
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative inline-block text-center">
      <img
        src={preview || '/default-avatar.png'}
        alt="Avatar"
        className="w-20 h-20 rounded-full object-cover border-2 border-white shadow mx-auto"
      />

      <label className="absolute bottom-0 right-0 bg-white rounded-full p-1 cursor-pointer shadow">
        <CameraIcon className="w-4 h-4 text-gray-700" />
        <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </label>

      {uploading && <div className="mt-2 text-sm text-gray-500">Uploading…</div>}
      {error && <div className="mt-1 text-xs text-red-500">{error}</div>}
    </div>
  )
}

export default AvatarUploader
