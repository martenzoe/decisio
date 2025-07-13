import express from 'express'
import verifyJWT from '../middleware/verifyJWT.js'

const router = express.Router()

router.post('/recommendation', verifyJWT, async (req, res) => {
  const { decisionName, description, options, criteria } = req.body
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) return res.status(500).json({ error: 'Kein API-Key gesetzt' })

  const prompt = `
Du bist ein Entscheidungscoach. Bewerte jede Option zu jedem Kriterium (1–10) mit Begründung. Antworte ausschließlich im JSON-Format:

{
  "bewertungen": [
    {
      "option": "OPTIONNAME",
      "bewertungen": [
        { "kriterium": "KRITERIUMNAME", "score": ZAHL, "begründung": "TEXT" }
      ]
    }
  ]
}

Entscheidung: ${decisionName}
Beschreibung: ${description}

Kriterien:
${criteria.map(c => `- ${c.name}`).join('\n')}

Optionen:
${options.map(o => `- ${o}`).join('\n')}
`

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0
      })
    })

    if (!openaiRes.ok) {
      const errText = await openaiRes.text()
      console.error('❌ OpenAI API Fehler:', errText)
      return res.status(500).json({ error: 'GPT API Antwort fehlgeschlagen' })
    }

    const result = await openaiRes.json()
    const raw = result.choices?.[0]?.message?.content?.trim()
    if (!raw) throw new Error('GPT-Antwort leer')

    console.log('📦 GPT Response:', raw)

    const parsed = JSON.parse(raw)

    const recommendations = parsed.bewertungen.map(entry => {
      const option_index = options.findIndex(opt => opt === entry.option)
      return {
        option_index,
        bewertungen: entry.bewertungen.map(b => {
          const criterion_index = criteria.findIndex(c => c.name === b.kriterium)
          return {
            criterion_index,
            value: b.score,
            explanation: b.begründung
          }
        })
      }
    })

    res.json({ recommendations })
  } catch (err) {
    console.error('❌ GPT Fehler:', err.message)
    res.status(500).json({ error: 'Fehler bei GPT-Antwort oder Parsing' })
  }
})

export default router
