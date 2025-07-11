// server/routes/team.js
import express from 'express'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { supabase } from '../db.js'
import verifyJWT from '../middleware/verifyJWT.js'
import { Resend } from 'resend'

const router = express.Router()
const resend = new Resend(process.env.RESEND_API_KEY)
const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

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

// ✅ Nutzer einladen
router.post('/invite', verifyJWT, async (req, res) => {
  const { decision_id, email, role } = req.body
  const invitedBy = req.userId

  if (!email || !decision_id || !role) {
    return res.status(400).json({ error: 'Missing fields' })
  }

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
      .eq('id', decision_id)
      .single()
    if (!decisionData) throw new Error('Decision not found')

    const token = crypto.randomBytes(16).toString('hex')
    const invite_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    let userIdToUse = null

    if (user) {
      userIdToUse = user.id
      const { data: existing } = await supabase
        .from('team_members')
        .select('id')
        .eq('user_id', userIdToUse)
        .eq('decision_id', decision_id)
        .maybeSingle()
      if (existing) return res.status(409).json({ error: 'User already invited or member' })
    }

    const { error: inviteInsertError } = await supabase
      .from('team_members')
      .insert([{
        decision_id,
        user_id: userIdToUse,
        role,
        invited_by: invitedBy,
        invite_token: token,
        invite_expires_at,
        accepted: false
      }])
    if (inviteInsertError) throw inviteInsertError

    const inviteUrl = `${BASE_URL}/invite?token=${token}`

    if (userIdToUse) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert([{
          user_id: userIdToUse,
          message: `Du wurdest zur Entscheidung "${decisionData.name}" eingeladen.`,
          link: `/invite?token=${token}`,
          read: false,
          decision_id,
          inviter_id: invitedBy
        }])
      if (notifError) console.warn('⚠️ Notification-Fehler:', notifError.message)
    }

    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'no-reply@decisia.de',
      to: email,
      subject: 'Einladung zu Decisia',
      html: `
        <p><strong>${inviterData?.nickname || 'Jemand'}</strong> hat dich zur Entscheidung <strong>"${decisionData.name}"</strong> eingeladen.</p>
        <p><a href="${inviteUrl}">Jetzt teilnehmen</a></p>
        <p>Der Link ist 7 Tage gültig.</p>
      `
    })

    res.status(200).json({ message: 'Einladung erfolgreich' })
  } catch (error) {
    console.error('❌ Fehler bei Einladung:', error)
    res.status(500).json({ error: 'Fehler beim Einladen' })
  }
})

// ✅ Team-Mitglieder abrufen
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
        users!team_members_user_id_fkey (
          nickname,
          avatar_url
        )
      `)
      .eq('decision_id', decisionId)
    if (error) throw error

    res.status(200).json(data)
  } catch (err) {
    console.error('❌ Fehler beim Abrufen der Team-Mitglieder:', err)
    res.status(500).json({ error: 'Fehler beim Abrufen der Team-Mitglieder' })
  }
})

// ✅ Invite-Link validieren
router.get('/validate/:token', async (req, res) => {
  const token = req.params.token

  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('id, decision_id, user_id, role, invite_expires_at, accepted')
      .eq('invite_token', token)
      .maybeSingle()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Ungültiger Token' })
    if (data.accepted) return res.status(410).json({ error: 'Einladung wurde bereits angenommen' })

    const isExpired = new Date(data.invite_expires_at) < new Date()
    if (isExpired) return res.status(410).json({ error: 'Einladungslink abgelaufen' })

    res.status(200).json(data)
  } catch (err) {
    console.error('❌ Fehler bei Token-Validierung:', err)
    res.status(500).json({ error: 'Fehler bei der Token-Validierung' })
  }
})

// ✅ Einladung annehmen
router.post('/accept', verifyJWT, async (req, res) => {
  const { invite_token } = req.body
  const userId = req.userId

  if (!invite_token) {
    return res.status(400).json({ error: 'Kein Invite-Token übermittelt' })
  }

  try {
    const { data: memberData, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('invite_token', invite_token)
      .maybeSingle()
    if (error) throw error
    if (!memberData) return res.status(404).json({ error: 'Ungültiger Token' })

    if (!memberData.user_id) {
      const { error: updateUserIdError } = await supabase
        .from('team_members')
        .update({ user_id: userId })
        .eq('id', memberData.id)
      if (updateUserIdError) throw updateUserIdError
    } else if (memberData.user_id !== userId) {
      return res.status(403).json({ error: 'Nicht berechtigt' })
    }

    const { error: updateAcceptedError } = await supabase
      .from('team_members')
      .update({ accepted: true })
      .eq('id', memberData.id)
    if (updateAcceptedError) throw updateAcceptedError

    if (memberData.invited_by) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert([{
          user_id: memberData.invited_by,
          message: `Die Einladung zur Entscheidung wurde angenommen.`,
          decision_id: memberData.decision_id,
          read: false
        }])
      if (notifError) console.warn('⚠️ Fehler bei Notification:', notifError.message)
    }

    res.status(200).json({
      message: 'Einladung angenommen',
      decision_id: memberData.decision_id
    })
  } catch (err) {
    console.error('❌ Fehler bei Annahme:', err)
    res.status(500).json({ error: 'Fehler beim Annehmen der Einladung' })
  }
})

export default router
