import express from 'express'
import supabase from '../supabaseClient.js'
import verifyJWT from '../middleware/verifyJWT.js' // ✅ Das existiert bei dir

const router = express.Router()

// POST /api/team/create
router.post('/create', verifyJWT, async (req, res) => {
  const { name, description, mode, timer } = req.body
  const userId = req.userId // ✅ so setzt es deine verifyJWT.js

  try {
    const { data: decision, error: decisionError } = await supabase
      .from('decisions')
      .insert([{ name, description, mode, type: 'team', user_id: userId }])
      .select()
      .single()

    if (decisionError) throw decisionError

    const { data: team, error: teamError } = await supabase
      .from('team_decisions')
      .insert([{ decision_id: decision.id, timer, created_by: userId }])
      .select()
      .single()

    if (teamError) throw teamError

    const { error: memberError } = await supabase
      .from('team_members')
      .insert([{ decision_id: decision.id, user_id: userId, role: 'owner', accepted: true }])

    if (memberError) throw memberError

    res.status(200).json({ decision, team })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Fehler beim Erstellen der Team-Entscheidung' })
  }
})

// POST /api/team/invite
router.post('/invite', verifyJWT, async (req, res) => {
  const { decisionId, email, role } = req.body
  const invitedBy = req.userId

  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (userError) return res.status(404).json({ error: 'Nutzer nicht gefunden' })

    const { error: inviteError } = await supabase
      .from('team_members')
      .insert([{
        decision_id: decisionId,
        user_id: user.id,
        role,
        invited_by: invitedBy,
        accepted: false
      }])

    if (inviteError) throw inviteError

    res.status(200).json({ message: 'Einladung erfolgreich' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Fehler beim Einladen' })
  }
})

// POST /api/team/accept
router.post('/accept', verifyJWT, async (req, res) => {
  const { decisionId } = req.body
  const userId = req.userId

  try {
    const { error } = await supabase
      .from('team_members')
      .update({ accepted: true })
      .eq('decision_id', decisionId)
      .eq('user_id', userId)

    if (error) throw error

    res.status(200).json({ message: 'Teilnahme bestätigt' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Fehler beim Bestätigen' })
  }
})

export default router
