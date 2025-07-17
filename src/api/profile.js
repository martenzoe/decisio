// src/api/profile.js
import { useAuthStore } from '../store/useAuthStore'

export async function fetchProfile() {
  const { token } = useAuthStore.getState()
  const res = await fetch('https://decisio.onrender.com/api/users/me', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Profil konnte nicht geladen werden')
  return data
}

export async function saveProfile(profileData) {
  const { token } = useAuthStore.getState()
  const res = await fetch('https://decisio.onrender.com/api/users/update', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(profileData)
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Profil konnte nicht gespeichert werden')
  return data
}
