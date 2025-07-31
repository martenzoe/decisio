import express from 'express'
import verifyJWT from '../middleware/verifyJWT.js'
import { supabase } from '../db.js'
import fetch from 'node-fetch'

const router = express.Router()

// KI-Auswertung für Team-Entscheidung + direkt speichern
router.post('/recommendation/:decisionId', verifyJWT, async (req, res) => {
  const userId = req.userId
  const { decisionId } = req.params
  const { decisionName, description, options, criteria } = req.body

  // 1. Berechtigungsprüfung (nur Owner/Admin der Team-Entscheidung)
  const { data: member, error: memberErr } = await supabase
    .from('team_members')
    .select('role')
    .eq('decision_id', decisionId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return res.status(403).json({ error: 'Nur Owner/Admin dürfen AI-Bewertung starten.' })
  }

  // 2. GPT-Request aufrufen (wie bestehende Route – kannst du ggf. importieren)
  // Hier Code direkt eingebettet (ggf. DRY später!):

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Kein API-Key gesetzt' })

  const prompt = `
Du bist ein Entscheidungscoach. Bewerte jede Option zu jedem Kriterium (1–10) mit Begründung. Antworte ausschließlich im JSON-Format:

{
  "bewertungen": [
    {
      "option": "OPTIONNAME",
      "bewertungen": [
        { "kriterium": "KRITERIUMNAME", "score": ZAHL, "begruendung": "TEXT" }
      ]
    }
  ]
}

Entscheidung: ${decisionName}
Beschreibung: ${description}

Kriterien:
${criteria.map(c => `- ${c.name}`).join('\n')}

Optionen:
${options.map(o => `- ${o.name}`).join('\n')}
`

  try {
    const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
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

    if (!gptRes.ok) {
      const errText = await gptRes.text()
      return res.status(500).json({ error: 'GPT API Fehler', details: errText })
    }

    const result = await gptRes.json()
    const raw = result.choices?.[0]?.message?.content?.trim()
    if (!raw) throw new Error('GPT-Antwort leer')

    const parsed = JSON.parse(raw)

    // 3. Vorherige AI-Evaluations löschen
    await supabase
      .from('evaluations')
      .delete()
      .eq('decision_id', decisionId)
      .eq('generated_by', 'ai')

    // 4. Neue AI-Evaluations speichern
    const allInserts = []
    parsed.bewertungen.forEach(entry => {
      const option = options.find(o => o.name === entry.option)
      if (!option) return
      entry.bewertungen.forEach(b => {
        const criterion = criteria.find(c => c.name === b.kriterium)
        if (!criterion) return
        allInserts.push({
          decision_id: decisionId,
          option_id: option.id,
          criterion_id: criterion.id,
          value: b.score,
          explanation: b.begruendung,
          generated_by: 'ai',
          // user_id: null oder adminId – KI-Eintrag!
        })
      })
    })

    if (allInserts.length > 0) {
      const { error: insErr } = await supabase.from('evaluations').insert(allInserts)
      if (insErr) throw insErr
    }

    res.json({ success: true, inserted: allInserts.length, raw_gpt: parsed })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
