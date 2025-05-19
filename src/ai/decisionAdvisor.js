// src/ai/decisionAdvisor.js
export async function getGPTRecommendation({ decisionName, description, options, criteria }) {
  const token = localStorage.getItem('token')

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

    return data.recommendations || []
  } catch (err) {
    console.error('⚠️ GPT Fehler:', err.message)
    return []
  }
}
