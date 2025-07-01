import express from 'express'
import supabase from '../supabaseClient.js'
import verifyJWT from '../middleware/verifyJWT.js'

const router = express.Router()

// ✅ POST /api/team/create
router.post('/create', verifyJWT, async (req, res) => {
  const { name, description, mode, timer } = req.body
  const userId = req.userId

  try {
    const { data: decision, error: decisionError } = await supabase
      .from('decisions')
      .insert([{ name, description, mode, type: 'private', user_id: userId }])
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

// ✅ POST /api/team/invite
router.post('/invite', verifyJWT, async (req, res) => {
  const { decisionId, email, role } = req.body
  const invitedBy = req.userId

  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (userError || !user) {
      return res.status(404).json({ error: 'Nutzer nicht gefunden' })
    }

    const { data: existing, error: existingError } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('decision_id', decisionId)
      .maybeSingle()

    if (existing) {
      return res.status(409).json({ error: 'User already invited or member' })
    }

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

// ✅ POST /api/team/accept
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

// ✅ GET /api/team/team-members/:id
router.get('/team-members/:id', verifyJWT, async (req, res) => {
  const decisionId = req.params.id

  try {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        id,
        user_id,
        role,
        accepted,
        users:user_id (
          nickname,
          avatar_url
        )
      `)
      .eq('decision_id', decisionId)

    if (error) throw error

    res.status(200).json(data)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Fehler beim Abrufen der Teammitglieder' })
  }
})

export default router
