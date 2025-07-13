import { useAuthStore } from '../store/useAuthStore'

export async function getGPTRecommendation({ decisionName, description, options, criteria }) {
  const token = useAuthStore.getState().token
  if (!token) throw new Error('⛔ Kein gültiger Auth-Token')

  try {
    const res = await fetch('http://localhost:3000/api/ai/recommendation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ decisionName, description, options, criteria })
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'GPT-Anfrage fehlgeschlagen')

    if (!Array.isArray(data.recommendations)) {
      throw new Error('❌ Keine Empfehlungen im erwarteten Format')
    }

    return data.recommendations
  } catch (err) {
    console.error('⚠️ GPT Fehler:', err.message)
    return []
  }
}
