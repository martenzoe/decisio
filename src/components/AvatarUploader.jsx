import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { CameraIcon } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'

function AvatarUploader({ avatarUrl, onUpload }) {
  const [uploading, setUploading] = useState(false)
  const { user } = useAuthStore()

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    setUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${crypto.randomUUID()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Upload in Bucket "avatars"
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) throw new Error(uploadError.message)

      // 📎 Öffentliche URL generieren
      const {
        data: { publicUrl },
        error: publicUrlError,
      } = supabase.storage.from('avatars').getPublicUrl(filePath)

      if (publicUrlError || !publicUrl) throw new Error('URL konnte nicht geladen werden')

      onUpload(publicUrl)
    } catch (err) {
      console.error('❌ Avatar-Upload fehlgeschlagen:', err.message)
      alert(`Fehler: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative inline-block text-center">
      <img
        src={avatarUrl || '/default-avatar.png'}
        alt="Avatar"
        className="w-20 h-20 rounded-full object-cover border-2 border-white shadow mx-auto"
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
      {uploading && (
        <div className="mt-2 text-sm text-gray-500">uploading…</div>
      )}
    </div>
  )
}

export default AvatarUploader
