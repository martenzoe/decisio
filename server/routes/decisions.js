// server/routes/decisions.js
import express from 'express'
import { supabase } from '../db.js'
import verifyJWT from '../middleware/verifyJWT.js'

const router = express.Router()

// ➕ Entscheidung speichern
router.post('/', verifyJWT, async (req, res) => {
  const { name } = req.body
  const user_id = req.userId

  if (!name) {
    return res.status(400).json({ error: 'Name is required' })
  }

  const { data, error } = await supabase
    .from('decisions')
    .insert([{ name, user_id }])
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  res.json(data)
})

// ➕ Optionen speichern
router.post('/decision/:id/options', verifyJWT, async (req, res) => {
  const { options } = req.body
  const decision_id = req.params.id

  if (!options || !Array.isArray(options)) {
    return res.status(400).json({ error: 'Options must be an array' })
  }

  const inserts = options.map((name) => ({ name, decision_id }))

  const { error } = await supabase.from('options').insert(inserts)

  if (error) return res.status(500).json({ error: error.message })

  res.json({ message: 'Options saved' })
})

// ➕ Kriterien speichern
router.post('/decision/:id/criteria', verifyJWT, async (req, res) => {
  const { criteria } = req.body
  const decision_id = req.params.id

  if (!criteria || !Array.isArray(criteria)) {
    return res.status(400).json({ error: 'Criteria must be an array' })
  }

  const inserts = criteria.map((c) => ({
    name: c.name,
    weight: Number(c.weight),
    decision_id,
  }))

  const { error } = await supabase.from('criteria').insert(inserts)

  if (error) return res.status(500).json({ error: error.message })

  res.json({ message: 'Criteria saved' })
})

export default router
