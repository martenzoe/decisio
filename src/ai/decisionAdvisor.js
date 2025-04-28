export async function getGPTRecommendation({ decisionName, description, options, criteria }) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  
    const prompt = `
  Du bist ein hilfreicher Entscheidungsexperte. Analysiere die folgende Entscheidungssituation und gib für jede Option eine Bewertung (Score von 0 bis 10), sowie eine kurze Begründung, basierend auf den Kriterien.
  
  ### Entscheidung:
  ${decisionName}
  
  ### Beschreibung:
  ${description}
  
  ### Kriterien & Gewichtung:
  ${criteria.map(c => `- ${c.name} (${c.weight}%)`).join('\n')}
  
  ### Optionen:
  ${options.map(o => `- ${o}`).join('\n')}
  
  ### Format:
  Antworte bitte **nur** im folgenden JSON-Format:
  
  {
    "bewertungen": [
      {
        "option": "Cloud Engineer",
        "score": 8.5,
        "begründung": "Sehr gefragt, gute Work-Life-Balance."
      },
      ...
    ]
  }
  `
  
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    })
  
    const result = await response.json()
  
    try {
      const content = result.choices?.[0]?.message?.content?.trim()
      const parsed = JSON.parse(content)
      return parsed.bewertungen || []
    } catch (err) {
      console.error('⚠️ Fehler beim Parsen der GPT-Antwort:', result)
      return []
    }
  }
  