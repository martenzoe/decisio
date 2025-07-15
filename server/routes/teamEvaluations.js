// server/routes/teamEvaluations.js
import express from 'express'
import { supabase } from '../db.js'
import verifyJWT from '../middleware/verifyJWT.js'
import crypto from 'crypto'

const router = express.Router()

// Upsert (Insert/Update) Bewertung durch Teammitglied
router.post('/', verifyJWT, async (req, res) => {
  const user_id = req.userId
  const { decision_id, option_id, criterion_id, value, explanation } = req.body

  if (!decision_id || !option_id || !criterion_id || value === undefined) {
    return res.status(400).json({ error: 'Missing fields' })
  }

  try {
    // Existiert schon eine Bewertung für diesen User/Option/Kriterium?
    const { data: existing, error: findErr } = await supabase
      .from('evaluations')
      .select('id')
      .eq('decision_id', decision_id)
      .eq('option_id', option_id)
      .eq('criterion_id', criterion_id)
      .eq('user_id', user_id)
      .maybeSingle()
    if (findErr) throw findErr

    if (existing) {
      // Update
      const { error: updateErr } = await supabase
        .from('evaluations')
        .update({ value, explanation })
        .eq('id', existing.id)
      if (updateErr) throw updateErr
      return res.json({ message: 'Bewertung aktualisiert' })
    } else {
      // Insert
      const { error: insertErr } = await supabase
        .from('evaluations')
        .insert([{
          id: crypto.randomUUID(),
          decision_id,
          option_id,
          criterion_id,
          user_id,
          value,
          explanation: explanation || null
        }])
      if (insertErr) throw insertErr
      return res.json({ message: 'Bewertung gespeichert' })
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Alle Bewertungen einer Entscheidung abrufen (optional: nach User gruppieren)
router.get('/:decision_id', verifyJWT, async (req, res) => {
  const user_id = req.userId
  const { decision_id } = req.params

  try {
    // Nur Mitglieder dürfen sehen
    const { data: member } = await supabase
      .from('team_members')
      .select('id')
      .eq('decision_id', decision_id)
      .eq('user_id', user_id)
      .eq('accepted', true)
      .maybeSingle()
    if (!member) {
      return res.status(403).json({ error: 'Kein Zugriff' })
    }

    // Alle Bewertungen holen
    const { data, error } = await supabase
      .from('evaluations')
      .select('*')
      .eq('decision_id', decision_id)
    if (error) throw error

    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
