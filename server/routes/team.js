import express from 'express'
import jwt from 'jsonwebtoken'
import supabase from '../supabaseClient.js'
import verifyJWT from '../middleware/verifyJWT.js'
import { sendInviteMail } from '../utils/mailer.js'

const router = express.Router()

// ✅ Team-Entscheidung erstellen
router.post('/create', verifyJWT, async (req, res) => {
  const { name, description, mode, timer, type } = req.body
  const userId = req.userId

  try {
    const { data: decision, error: decisionError } = await supabase
      .from('decisions')
      .insert([{ name, description, mode, type, user_id: userId }])
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

// ✅ Nutzer einladen (per E-Mail)
router.post('/invite', verifyJWT, async (req, res) => {
  const { decisionId, email, role } = req.body
  const invitedBy = req.userId

  try {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    const { data: inviterData } = await supabase
      .from('users')
      .select('nickname')
      .eq('id', invitedBy)
      .single()

    const { data: decisionData } = await supabase
      .from('decisions')
      .select('name')
      .eq('id', decisionId)
      .single()

    if (!user) {
      // ➕ Nutzer existiert NICHT
      const token = jwt.sign(
        { email, decisionId, role, invitedBy },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      await sendInviteMail({
        to: email,
        inviterNickname: inviterData.nickname,
        decisionName: decisionData.name,
        inviteToken: token
      })

      return res.status(200).json({ message: 'Einladung versendet – Nutzer muss sich registrieren' })
    }

    // 👤 Nutzer existiert bereits – prüfen ob schon eingeladen
    const { data: existing } = await supabase
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

    await sendInviteMail({
      to: email,
      inviterNickname: inviterData.nickname,
      decisionName: decisionData.name
    })

    res.status(200).json({ message: 'Einladung erfolgreich' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Fehler beim Einladen' })
  }
})

// ✅ Einladung annehmen
router.post('/accept', verifyJWT, async (req, res) => {
  const { decisionId } = req.body
  const userId = req.userId

  try {
    const { data: existing, error: fetchError } = await supabase
      .from('team_members')
      .select('accepted')
      .eq('decision_id', decisionId)
      .eq('user_id', userId)
      .single()
    if (fetchError) throw fetchError

    if (existing.accepted) {
      return res.status(200).json({ message: 'Bereits bestätigt' })
    }

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

// ✅ Teammitglieder abrufen
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
      .order('role', { ascending: false })
      .order('accepted', { ascending: false })

    if (error) throw error

    res.status(200).json(data)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Fehler beim Abrufen der Teammitglieder' })
  }
})

export default router
