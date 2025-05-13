// server/routes/decisions.js
import express from 'express'
import { supabase } from '../db.js'
import verifyJWT from '../middleware/verifyJWT.js'

const router = express.Router()

// ✅ Entscheidung erstellen
router.post('/', verifyJWT, async (req, res) => {
  const { name, description, mode = 'manual', type = 'private' } = req.body
  const user_id = req.userId

  try {
    const { data, error } = await supabase
      .from('decisions')
      .insert([{ name, description, mode, type, user_id }])
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ✅ Optionen speichern
router.post('/:id/options', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const { options } = req.body

  const inserts = options.map(name => ({ name, decision_id }))
  const { error } = await supabase.from('options').insert(inserts)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ message: 'Optionen gespeichert' })
})

// ✅ Kriterien speichern
router.post('/:id/criteria', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const { criteria } = req.body

  const inserts = criteria.map(c => ({
    name: c.name,
    importance: Number(c.importance),
    decision_id,
  }))

  const { error } = await supabase.from('criteria').insert(inserts)
  if (error) return res.status(500).json({ error: error.message })

  res.json({ message: 'Kriterien gespeichert' })
})

// ✅ Bewertungen speichern inkl. Zuordnung via Index-Mapping
router.post('/:id/evaluations', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const { evaluations, options, criteria } = req.body

  try {
    // hole gespeicherte Optionen und Kriterien aus DB
    const { data: dbOptions } = await supabase
      .from('options')
      .select('id')
      .eq('decision_id', decision_id)

    const { data: dbCriteria } = await supabase
      .from('criteria')
      .select('id')
      .eq('decision_id', decision_id)

    // lösche vorherige Bewertungen
    await supabase.from('evaluations').delete().eq('decision_id', decision_id)

    const inserts = evaluations.map(ev => ({
      decision_id,
      option_id: dbOptions[ev.option_index]?.id,
      criterion_id: dbCriteria[ev.criterion_index]?.id,
      value: ev.value,
    })).filter(e => e.option_id && e.criterion_id)

    const { error } = await supabase.from('evaluations').insert(inserts)
    if (error) throw error

    res.json({ message: '✅ Bewertungen gespeichert' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
