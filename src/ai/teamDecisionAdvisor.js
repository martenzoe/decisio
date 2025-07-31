// src/ai/teamDecisionAdvisor.js
import { useAuthStore } from '../store/useAuthStore'

export async function getTeamGPTRecommendation({ decisionName, description, options, criteria }) {
  const token = useAuthStore.getState().token
  if (!token) throw new Error('⛔ Kein gültiger Auth-Token')

  try {
    const res = await fetch('/api/team-ai/recommendation', { // neuer Backend-Endpoint!
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ decisionName, description, options, criteria })
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'GPT-Anfrage fehlgeschlagen')

    // Erwartet: [{ option: "OptionA", bewertungen: [{ kriterium: "KritA", score: 7, begruendung: "Weil ..."}]}]
    if (!Array.isArray(data.recommendations)) {
      throw new Error('❌ Keine Empfehlungen im erwarteten Format')
    }

    return data.recommendations
  } catch (err) {
    console.error('⚠️ GPT Fehler:', err.message)
    return []
  }
}
