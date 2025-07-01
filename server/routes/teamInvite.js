import express from 'express'
import { supabase } from '../db.js'
import verifyJWT from '../middleware/verifyJWT.js'

const router = express.Router()

// POST /api/team-invite
router.post('/', verifyJWT, async (req, res) => {
  const inviter_id = req.userId
  const { decision_id, email, role } = req.body

  if (!email || !decision_id || !role) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    // 1. User mit dieser E-Mail finden
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found. They must register first.' })
    }

    const user_id = user.id

    // 2. Prüfen ob bereits eingeladen
    const { data: existing, error: existingError } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', user_id)
      .eq('decision_id', decision_id)
      .maybeSingle()

    if (existing) {
      return res.status(409).json({ error: 'User already invited or member' })
    }

    // 3. Einladung speichern
    const { error: insertError } = await supabase
      .from('team_members')
      .insert([
        {
          decision_id,
          user_id,
          role,
          invited_by: inviter_id,
          accepted: false
        }
      ])

    if (insertError) throw insertError

    res.status(201).json({ message: '✅ Invitation sent' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/team-members/:decision_id
router.get('/:decision_id', verifyJWT, async (req, res) => {
  const decision_id = req.params.decision_id

  try {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        id,
        role,
        accepted,
        invited_at,
        user_id,
        users (
          email,
          nickname,
          avatar_url
        )
      `)
      .eq('decision_id', decision_id)

    if (error) throw error

    const members = data.map(m => ({
      id: m.id,
      role: m.role,
      accepted: m.accepted,
      invited_at: m.invited_at,
      user_id: m.user_id,
      email: m.users?.email || 'unknown',
      nickname: m.users?.nickname || 'anonymous',
      avatar_url: m.users?.avatar_url || null
    }))

    res.json(members)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
