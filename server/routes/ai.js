// server/routes/ai.js
import express from 'express'
import crypto from 'crypto'
import verifyJWT from '../middleware/verifyJWT.js'
import { supabaseAdmin } from '../supabaseClient.js'

const router = express.Router()

function buildContentHash({ decisionName, description, options = [], criteria = [] }) {
  // Gewichte unbedingt mit in den Hash (sonst keine Neuberechnung bei Änderungen)
  const payload = {
    name: decisionName || '',
    description: description || '',
    options: options.filter(Boolean),
    criteria: criteria.map(c => ({ name: c?.name || '', importance: Number(c?.importance) || 0 })),
  }
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}

router.post('/recommendation', verifyJWT, async (req, res) => {
  const { decisionId, decisionName, description, options = [], criteria = [] } = req.body
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) return res.status(500).json({ error: 'Kein API-Key gesetzt' })

  // 1) Wenn decisionId vorhanden → erst Cache prüfen
  const content_hash = buildContentHash({ decisionName, description, options, criteria })

  if (decisionId) {
    const { data: cached, error: cacheErr } = await supabaseAdmin
      .from('ai_summaries')
      .select('summary, top_option')
      .eq('decision_id', decisionId)
      .eq('content_hash', content_hash)
      .maybeSingle()

    if (!cacheErr && cached) {
      const topName = cached.top_option || null
      const topIdx = topName ? options.findIndex(o => String(o) === String(topName)) : -1
      return res.json({
        recommendations: [],              // für Detailseite nicht nötig
        summary: cached.summary || null,
        top_option: topName,
        top_option_index: topIdx
      })
    }
  }

  // 2) Kein Cache-Treffer → OpenAI einmalig fragen
  const inputForLangDetection = `
Titel: ${decisionName || '-'}
Beschreibung: ${description || '-'}
Kriterien: ${criteria.map(c => c?.name).filter(Boolean).join(', ') || '-'}
Optionen: ${options.filter(Boolean).join(', ') || '-'}
`.trim()

  const prompt = `
Du bist ein Entscheidungscoach.

AUFGABE:
- Bewerte jede Option zu jedem Kriterium (Skala 1–10) mit kurzer Begründung.
- Liefere zusätzlich eine kurze Gesamteinschätzung ("summary", 3–5 Sätze).
- Bestimme die "top_option" als beste Gesamtlösung.

SPRACHE:
- Erkenne automatisch Deutsch ODER Englisch anhand der Eingaben unten.
- Schreibe Begründungen und summary **in der erkannten Sprache**.
- Übersetze keine Namen (Optionen/Kriterien).
- Bei stark gemischten Eingaben: Englisch.

AUSGABE: **reines JSON** (keine Markdown-Codes), Schlüssel auf Deutsch:
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

EINGABEN:
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
        temperature: 0
        // response_format: { type: 'json_object' } // wenn Modell das unterstützt
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
      const cleaned = raw.replace(/^\s*```(?:json)?/i, '').replace(/```\s*$/, '').trim()
      parsed = JSON.parse(cleaned)
    } catch (e) {
      console.error('❌ JSON-Parse-Fehler. Rohantwort:', raw)
      throw new Error('JSON-Parsing fehlgeschlagen')
    }

    // Mapping fürs Frontend
    const recommendations = Array.isArray(parsed.bewertungen)
      ? parsed.bewertungen.map(entry => {
          const option_index = options.findIndex(opt => String(opt) === String(entry.option))
          const mapped = Array.isArray(entry.bewertungen)
            ? entry.bewertungen.map(b => {
                const criterion_index = criteria.findIndex(c => String(c.name) === String(b.kriterium))
                return { criterion_index, value: Number(b.score), explanation: b.begründung }
              })
            : []
          return { option_index, bewertungen: mapped }
        })
      : []

    const top_option = parsed.top_option || null
    const top_option_index = top_option ? options.findIndex(o => String(o) === String(top_option)) : -1
    const summary = parsed.summary || null

    // 3) Persistieren (nur wenn decisionId übergeben wurde)
    if (decisionId) {
      await supabaseAdmin
        .from('ai_summaries')
        .upsert(
          [{
            decision_id: decisionId,
            content_hash,
            summary,
            top_option,
            language: null,
            model: 'gpt-4',
            created_by: req.userId
          }],
          { onConflict: 'decision_id,content_hash' }
        )
    }

    return res.json({ recommendations, summary, top_option, top_option_index })
  } catch (err) {
    console.error('❌ GPT Fehler:', err.message)
    return res.status(500).json({ error: 'Fehler bei GPT-Antwort oder Parsing' })
  }
})

export default router
