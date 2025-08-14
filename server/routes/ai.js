// src/routes/ai.js
import express from 'express'
import verifyJWT from '../middleware/verifyJWT.js'

const router = express.Router()

router.post('/recommendation', verifyJWT, async (req, res) => {
  const { decisionName, description, options = [], criteria = [] } = req.body
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return res.status(500).json({ error: 'Kein API-Key gesetzt' })
  }

  // Für die Sprachdetektion geben wir der AI die reinen Eingaben mit.
  const inputForLangDetection = `
Titel: ${decisionName || '-'}
Beschreibung: ${description || '-'}
Kriterien: ${criteria.map(c => c?.name).filter(Boolean).join(', ') || '-'}
Optionen: ${options.filter(Boolean).join(', ') || '-'}
`.trim()

  const prompt = `
Du bist ein Entscheidungscoach.

AUFGABE:
- Bewerte jede Option zu jedem Kriterium (Skala 1–10) und gib pro Bewertung eine **kurze Begründung**.
- Liefere zusätzlich eine **kurze Gesamteinschätzung** ("summary", 3–5 Sätze).
- Bestimme die **Top-Option** ("top_option") als die am besten bewertete Gesamtlösung.

SPRACHE:
- **Erkenne automatisch die dominante Sprache (Deutsch ODER Englisch) anhand der Eingaben** (Titel, Beschreibung, Kriterien, Optionen) unten.
- Schreibe **Begründungen** und die **summary** **genau in der erkannten Sprache**.
- Übersetze **keine** Namen von Optionen/Kriterien.
- Wenn die Eingaben stark gemischt sind und keine Sprache überwiegt, schreibe auf **English**.

AUSGABEFORMAT (AUSSCHLIESSLICH RAW-JSON, ohne Markdown, ohne weiteres Drumherum):
{
  "bewertungen": [
    {
      "option": "OPTIONNAME",
      "bewertungen": [
        { "kriterium": "KRITERIUMNAME", "score": ZAHL_VON_1_BIS_10, "begründung": "KURZER TEXT" }
      ]
    }
  ],
  "top_option": "OPTIONNAME",
  "summary": "KURZER Fließtext (3–5 Sätze) in erkannter Sprache"
}

WICHTIG:
- **JSON-Schlüssel bleiben exakt deutsch** ("bewertungen", "kriterium", "begründung", "top_option", "summary").
- "score" ist eine ganze Zahl 1–10.
- Nutze **exakt** die übergebenen Options- und Kriteriennamen (keine Synonyme, keine Übersetzungen).
- Keine zusätzlichen Felder, keine Kommentare, kein Codeblock-Markdown.

EINGABEN (zur Spracherkennung und Bewertung):
${inputForLangDetection}
`.trim()

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
        temperature: 0,
        // Falls dein Modell das Feature unterstützt, erzwingt das strikt JSON:
        // response_format: { type: 'json_object' }
      })
    })

    if (!openaiRes.ok) {
      const errText = await openaiRes.text()
      console.error('❌ OpenAI API Fehler:', errText)
      return res.status(500).json({ error: 'GPT API Antwort fehlgeschlagen' })
    }

    const result = await openaiRes.json()
    const raw = result?.choices?.[0]?.message?.content?.trim()
    if (!raw) throw new Error('GPT-Antwort leer')

    let parsed
    try {
      // Entfernt evtl. fälschlich gesetzte Codefences
      const cleaned = raw.replace(/^\s*```(?:json)?/i, '').replace(/```\s*$/, '').trim()
      parsed = JSON.parse(cleaned)
    } catch (e) {
      console.error('❌ JSON-Parse-Fehler. Rohantwort:', raw)
      throw new Error('JSON-Parsing fehlgeschlagen')
    }

    // In dein bestehendes Frontend-Format mappen:
    // { recommendations: [{ option_index, bewertungen: [{ criterion_index, value, explanation }] }], summary, top_option, top_option_index }
    const recommendations = Array.isArray(parsed.bewertungen) ? parsed.bewertungen.map(entry => {
      const option_index = options.findIndex(opt => String(opt) === String(entry.option))
      const mappedBewertungen = Array.isArray(entry.bewertungen)
        ? entry.bewertungen.map(b => {
            const criterion_index = criteria.findIndex(c => String(c.name) === String(b.kriterium))
            return {
              criterion_index,
              value: Number(b.score),
              explanation: b.begründung
            }
          })
        : []

      return { option_index, bewertungen: mappedBewertungen }
    }) : []

    const topOptionName = parsed.top_option || null
    const top_option_index = topOptionName ? options.findIndex(o => String(o) === String(topOptionName)) : -1
    const summary = parsed.summary || null

    return res.json({
      recommendations,
      summary,
      top_option: topOptionName,
      top_option_index
    })
  } catch (err) {
    console.error('❌ GPT Fehler:', err.message)
    return res.status(500).json({ error: 'Fehler bei GPT-Antwort oder Parsing' })
  }
})

export default router
