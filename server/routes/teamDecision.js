// server/routes/teamDecision.js

import express from 'express'
import supabase from '../supabaseClient.js'
import jwt from 'jsonwebtoken'

const router = express.Router()

// 🔐 Auth-Middleware
router.use((req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'No token provided' })

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' })
  }
})

// 📩 POST /api/team-decisions
router.post('/', async (req, res) => {
  const { name, description, mode, timer } = req.body
  const userId = req.user.id

  if (!['manual', 'ai'].includes(mode)) {
    return res.status(400).json({ error: 'Ungültiger Modus' })
  }

  try {
    // 1. Entscheidung in "decisions" einfügen
    const { data: decision, error: decisionError } = await supabase
      .from('decisions')
      .insert([
        {
          name,
          description,
          mode,
          user_id: userId,
          type: 'team' // Wichtig: Nur "team" erlaubt
        }
      ])
      .select()
      .single()

    if (decisionError) throw decisionError

    // 2. Eintrag in "team_decisions" mit Timer
    const { error: teamError } = await supabase
      .from('team_decisions')
      .insert([
        {
          decision_id: decision.id,
          timer: timer || null,
          created_by: userId
        }
      ])

    if (teamError) throw teamError

    return res.status(201).json({ decision })
  } catch (err) {
    console.error('❌ Fehler beim Erstellen der Team-Entscheidung:', err.message)
    return res.status(500).json({ error: err.message })
  }
})

export default router
