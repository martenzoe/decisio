const API_URL = 'http://localhost:3000/api/users'

// ⬇️ Profil abrufen
export const getProfile = async (token) => {
  const res = await fetch(`${API_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) throw new Error('Profil konnte nicht geladen werden.')
  return await res.json()
}

// ⬇️ Profil aktualisieren
export const updateProfile = async (token, data) => {
  const res = await fetch(`${API_URL}/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Profil konnte nicht aktualisiert werden.')
  return await res.json()
}
