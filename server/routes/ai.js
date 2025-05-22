// server/routes/ai.js
import express from 'express'
import verifyJWT from '../middleware/verifyJWT.js'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: KI-gestützte Empfehlungen
 */

/**
 * @swagger
 * /api/ai/recommendation:
 *   post:
 *     summary: Generiert Empfehlungen basierend auf Entscheidungskriterien
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - decisionName
 *               - description
 *               - options
 *               - criteria
 *             properties:
 *               decisionName:
 *                 type: string
 *               description:
 *                 type: string
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *               criteria:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *     responses:
 *       200:
 *         description: Empfehlungen generiert
 *       500:
 *         description: Fehler bei der KI-Antwort oder beim Parsing
 */


router.post('/recommendation', verifyJWT, async (req, res) => {
  const { decisionName, description, options, criteria } = req.body
  const apiKey = process.env.OPENAI_API_KEY

  const prompt = `
Du bist ein Entscheidungscoach. Bewerte, wie sehr jede Option jedes Kriterium erfüllt (Skala 1–10) und gib jeweils eine Begründung.

### Entscheidung:
${decisionName}

### Beschreibung:
${description}

### Kriterien:
${criteria.map(c => `- ${c.name}`).join('\n')}

### Optionen:
${options.map(o => `- ${o}`).join('\n')}

### Format (nur JSON!):
{
  "bewertungen": [
    {
      "option": "Cloud Engineer",
      "bewertungen": [
        { "kriterium": "Gehalt", "score": 9, "begründung": "Sehr gefragt und gut bezahlt." },
        { "kriterium": "Work Life Balance", "score": 7, "begründung": "Je nach Unternehmen." }
      ]
    }
  ]
}`

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
        temperature: 0 // deterministisch
      })
    })

    const result = await openaiRes.json()
    const raw = result.choices?.[0]?.message?.content?.trim()
    const parsed = JSON.parse(raw)

    res.json({ recommendations: parsed.bewertungen })
  } catch (err) {
    console.error('GPT Fehler:', err)
    res.status(500).json({ error: 'Fehler bei GPT-Antwort oder Parsing' })
  }
})

export default router
