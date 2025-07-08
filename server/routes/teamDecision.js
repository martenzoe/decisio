// server/routes/teamDecision.js

import express from 'express'
import supabase from '../supabaseClient.js'
import jwt from 'jsonwebtoken'

const router = express.Router()

// 🔐 Auth-Middleware (angepasst auf req.userId wie im Rest der App)
router.use((req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'No token provided' })

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId  // ✅ Einheitlich mit anderen Routen
    next()
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' })
  }
})

// 📩 POST /api/team-decisions
router.post('/', async (req, res) => {
  const { name, description, mode, timer } = req.body
  const userId = req.userId  // ✅ Einheitlich

  if (!['manual', 'ai'].includes(mode)) {
    return res.status(400).json({ error: 'Ungültiger Modus' })
  }

  try {
    // 1. Entscheidung anlegen
    const { data: decision, error: decisionError } = await supabase
      .from('decisions')
      .insert([
        {
          name,
          description,
          mode,
          user_id: userId,
          type: 'team'
        }
      ])
      .select()
      .single()

    if (decisionError) throw decisionError

    const decisionId = decision.id

    // 2. Team-Entscheidung anlegen
    const { error: teamError } = await supabase
      .from('team_decisions')
      .insert([
        {
          decision_id: decisionId,
          timer: timer || null,
          created_by: userId
        }
      ])

    if (teamError) throw teamError

    // 3. Ersteller als Teammitglied eintragen
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .insert([
        {
          decision_id: decisionId,
          user_id: userId,
          role: 'owner',
          invited_by: userId,
          accepted: true
        }
      ])
      .select('invite_token')
      .single()

    if (memberError) throw memberError

    // 4. Response
    return res.status(201).json({
      decision: { id: decisionId },
      invite_token: member.invite_token
    })
  } catch (err) {
    console.error('❌ Fehler beim Erstellen der Team-Entscheidung:', err.message)
    return res.status(500).json({ error: 'Interner Serverfehler' })
  }
})

export default router
