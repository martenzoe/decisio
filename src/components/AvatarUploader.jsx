// src/components/AvatarUploader.jsx
import { useState } from "react"
import { supabase } from "../supabaseClient"

function AvatarUploader({ onUpload }) {
  const [uploading, setUploading] = useState(false)

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)

    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file)

    if (error) {
      console.error("Upload error:", error.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath)

    if (data?.publicUrl) {
      onUpload(data.publicUrl)
    }

    setUploading(false)
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
    </div>
  )
}

export default AvatarUploader
