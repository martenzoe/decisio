// server/routes/decisions.js
import express from 'express'
import { supabase } from '../db.js'
import verifyJWT from '../middleware/verifyJWT.js'

const router = express.Router()

// ➕ Neue Entscheidung speichern
router.post('/', verifyJWT, async (req, res) => {
  const { name, description, mode, type } = req.body
  const user_id = req.userId

  console.log('🧾 Neue Entscheidung:', { name, description, mode, type })
  console.log('👤 Benutzer-ID:', user_id)

  if (!name) return res.status(400).json({ error: 'Name is required' })

  const { data, error } = await supabase
    .from('decisions')
    .insert([{ name, description, mode, type, user_id }])
    .select()
    .single()

  if (error) {
    console.error('❌ Supabase-Fehler beim Speichern der Entscheidung:', error.message)
    return res.status(500).json({ error: error.message })
  }

  res.json(data)
})

// 📥 Optionen speichern
router.post('/:id/options', verifyJWT, async (req, res) => {
  const { options } = req.body
  const decision_id = req.params.id

  if (!Array.isArray(options)) {
    return res.status(400).json({ error: 'Options must be an array' })
  }

  const inserts = options.map((name) => ({ name, decision_id }))
  const { error } = await supabase.from('options').insert(inserts)

  if (error) {
    console.error('❌ Supabase-Fehler beim Speichern der Optionen:', error.message)
    return res.status(500).json({ error: error.message })
  }

  res.json({ message: 'Options saved' })
})

// 📥 Kriterien speichern
router.post('/:id/criteria', verifyJWT, async (req, res) => {
  const { criteria } = req.body
  const decision_id = req.params.id

  if (!Array.isArray(criteria)) {
    return res.status(400).json({ error: 'Criteria must be an array' })
  }

  const inserts = criteria.map((c) => ({
    name: c.name,
    weight: Number(c.weight),
    decision_id,
  }))

  const { error } = await supabase.from('criteria').insert(inserts)

  if (error) {
    console.error('❌ Supabase-Fehler beim Speichern der Kriterien:', error.message)
    return res.status(500).json({ error: error.message })
  }

  res.json({ message: 'Criteria saved' })
})

// 📤 Alle Entscheidungen des Users abrufen
router.get('/', verifyJWT, async (req, res) => {
  const user_id = req.userId
  console.log('🔍 Abfrage für user_id:', user_id)

  const { data, error } = await supabase
    .from('decisions')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Supabase-Fehler beim Abrufen der Entscheidungen:', error.message)
    return res.status(500).json({ error: error.message })
  }

  res.json(data)
})

// 🔍 Einzelne Entscheidung abrufen
router.get('/:id', verifyJWT, async (req, res) => {
  const user_id = req.userId
  const decision_id = req.params.id

  const { data, error } = await supabase
    .from('decisions')
    .select('*')
    .eq('id', decision_id)
    .eq('user_id', user_id)
    .single()

  if (error) {
    console.error('❌ Supabase-Fehler beim Abrufen einer einzelnen Entscheidung:', error.message)
    return res.status(500).json({ error: error.message })
  }

  res.json(data)
})

export default router
