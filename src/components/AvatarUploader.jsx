// src/components/AvatarUploader.jsx
import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { CameraIcon } from 'lucide-react'

function AvatarUploader({ avatarUrl, onUpload }) {
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`

    const { error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true })

    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
      onUpload(data.publicUrl)
    }
    setUploading(false)
  }

  return (
    <div className="relative inline-block">
      <img
        src={avatarUrl || '/default-avatar.png'}
        alt="Avatar"
        className="w-20 h-20 rounded-full object-cover border-2 border-white shadow"
      />
      <label className="absolute bottom-0 right-0 bg-white rounded-full p-1 cursor-pointer shadow">
        <CameraIcon className="w-4 h-4 text-gray-700" />
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />
      </label>
    </div>
  )
}

export default AvatarUploader
