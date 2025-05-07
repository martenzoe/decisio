// server/routes/decisions.js
import express from 'express'
import { supabase } from '../db.js'
import verifyJWT from '../middleware/verifyJWT.js'

const router = express.Router()

// Entscheidung speichern
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

export default router
