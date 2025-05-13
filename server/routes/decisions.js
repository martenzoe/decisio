// server/routes/decisions.js
import express from 'express'
import { supabase } from '../db.js'
import verifyJWT from '../middleware/verifyJWT.js'

const router = express.Router()

// 🔸 Entscheidung erstellen
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
    console.error('❌ Fehler beim Erstellen der Entscheidung:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// 🔸 Optionen hinzufügen
router.post('/:id/options', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const { options } = req.body

  try {
    const inserts = options.map(name => ({ name, decision_id }))
    const { error } = await supabase.from('options').insert(inserts)
    if (error) throw error
    res.json({ message: 'Optionen gespeichert' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 🔸 Kriterien hinzufügen
router.post('/:id/criteria', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const { criteria } = req.body

  try {
    const inserts = criteria.map(c => ({
      name: c.name,
      importance: Number(c.importance),
      decision_id,
    }))
    const { error } = await supabase.from('criteria').insert(inserts)
    if (error) throw error
    res.json({ message: 'Kriterien gespeichert' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 🔸 Bewertungen (Evaluations) speichern
router.post('/:id/evaluations', verifyJWT, async (req, res) => {
  const { evaluations } = req.body

  try {
    const inserts = evaluations.map(e => ({
      option_id: e.option_id,
      criterion_id: e.criterion_id,
      score: Number(e.score),
    }))
    const { error } = await supabase.from('evaluations').insert(inserts)
    if (error) throw error
    res.json({ message: 'Bewertungen gespeichert' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 🔸 Entscheidung + Optionen + Kriterien + Bewertungen abrufen
router.get('/:id/details', verifyJWT, async (req, res) => {
  const user_id = req.userId
  const decision_id = req.params.id

  try {
    const { data: decision, error: err1 } = await supabase
      .from('decisions')
      .select('*')
      .eq('id', decision_id)
      .eq('user_id', user_id)
      .single()

    if (err1) throw err1

    const { data: options } = await supabase
      .from('options')
      .select('*')
      .eq('decision_id', decision_id)

    const { data: criteria } = await supabase
      .from('criteria')
      .select('*')
      .eq('decision_id', decision_id)

    const { data: evaluations } = await supabase
      .from('evaluations')
      .select('*')
      .in('option_id', options.map(o => o.id))

    res.json({ decision, options, criteria, evaluations })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
