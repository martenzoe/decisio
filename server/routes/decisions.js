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

// 🧾 Optionen abrufen
router.get('/:id/options', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const { data, error } = await supabase
    .from('options')
    .select('*')
    .eq('decision_id', decision_id)

  if (error) return res.status(500).json({ error: error.message })

  res.json(data)
})

// 🧾 Kriterien abrufen
router.get('/:id/criteria', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const { data, error } = await supabase
    .from('criteria')
    .select('*')
    .eq('decision_id', decision_id)

  if (error) return res.status(500).json({ error: error.message })

  res.json(data)
})

// 📝 Bewertungen speichern
router.post('/:id/evaluations', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const { evaluations } = req.body

  if (!evaluations || !Array.isArray(evaluations)) {
    return res.status(400).json({ error: 'Evaluations must be an array' })
  }

  // Bestehende löschen (Clean Slate Prinzip)
  await supabase
    .from('evaluations')
    .delete()
    .eq('decision_id', decision_id)

  // Einfügen der neuen Bewertungen
  const inserts = evaluations.map((ev) => ({
    decision_id,
    option_id: ev.option_id,
    criterion_id: ev.criterion_id,
    value: Number(ev.value),
  }))

  const { error } = await supabase.from('evaluations').insert(inserts)

  if (error) return res.status(500).json({ error: error.message })

  res.json({ message: '✅ Bewertungen gespeichert' })
})


export default router
