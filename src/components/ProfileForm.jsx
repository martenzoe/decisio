// src/components/ProfileForm.jsx
import { useState, useEffect } from "react"
import AvatarUploader from "./AvatarUploader"
import { supabase } from "../supabaseClient"

function ProfileForm({ user }) {
  const [nickname, setNickname] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("users")
      .select("nickname, avatar_url")
      .eq("id", user.id)
      .single()

    if (data) {
      setNickname(data.nickname || "")
      setAvatarUrl(data.avatar_url || "")
    }

    setLoading(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    const { error } = await supabase
      .from("users")
      .update({ nickname, avatar_url: avatarUrl })
      .eq("id", user.id)

    setLoading(false)

    if (error) {
      setMessage("❌ Fehler beim Speichern")
    } else {
      setMessage("✅ Änderungen gespeichert")
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Nickname</label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Avatar</label>
        {avatarUrl && (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="h-16 w-16 rounded-full mb-2"
          />
        )}
        <AvatarUploader onUpload={setAvatarUrl} />
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? "Speichern..." : "Speichern"}
      </button>

      {message && <p className="text-sm mt-2">{message}</p>}
    </form>
  )
}

export default ProfileForm
