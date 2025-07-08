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

// ✅ Nutzer einladen (per E-Mail)
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

    if (!user) {
      const token = jwt.sign(
        { email, decisionId: decision_id, role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      const inviteUrl = `${BASE_URL}/invite?token=${token}`

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

      return res.status(200).json({ message: 'Einladung versendet – Nutzer muss sich registrieren' })
    }

    const { data: existing } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('decision_id', decision_id)
      .maybeSingle()

    if (existing) {
      return res.status(409).json({ error: 'User already invited or member' })
    }

    const token = crypto.randomBytes(16).toString('hex')
    const invite_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { error: inviteInsertError } = await supabase
      .from('team_members')
      .insert([{
        decision_id,
        user_id: user.id,
        role,
        invited_by: invitedBy,
        invite_token: token,
        invite_expires_at,
        accepted: false
      }])
    if (inviteInsertError) throw inviteInsertError

    const inviteUrl = `${BASE_URL}/invite?token=${token}`

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
    console.error(error)
    res.status(500).json({ error: 'Fehler beim Einladen' })
  }
})

// ✅ Einladung validieren (JWT oder DB-Token)
router.get('/validate/:token', async (req, res) => {
  const token = req.params.token

  // Erst versuchen, als JWT zu verifizieren
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    return res.status(200).json({
      type: 'jwt',
      email: decoded.email,
      decision_id: decoded.decisionId,
      role: decoded.role
    })
  } catch (jwtError) {
    // Wenn kein JWT – als Invite-Token in DB prüfen
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('id, decision_id, user_id, role, accepted, invite_expires_at')
        .eq('invite_token', token)
        .maybeSingle()

      if (error) throw error
      if (!data) return res.status(404).json({ error: 'Token not found' })

      const now = new Date()
      const expiry = new Date(data.invite_expires_at)
      if (expiry < now) return res.status(410).json({ error: 'Token expired' })

      return res.status(200).json({
        type: 'db',
        ...data
      })
    } catch (dbError) {
      return res.status(500).json({ error: 'Fehler bei der Validierung' })
    }
  }
})

// ✅ Einladung annehmen
router.post('/accept', verifyJWT, async (req, res) => {
  const { invite_token } = req.body
  const userId = req.userId

  if (!invite_token) {
    return res.status(400).json({ error: 'Token fehlt' })
  }

  try {
    const { data: invite, error } = await supabase
      .from('team_members')
      .select('id, decision_id, accepted, user_id')
      .eq('invite_token', invite_token)
      .maybeSingle()

    if (error || !invite) {
      return res.status(400).json({ error: 'Ungültiger oder abgelaufener Token' })
    }

    if (invite.user_id !== userId) {
      return res.status(403).json({ error: 'Diese Einladung gehört nicht zu deinem Benutzerkonto' })
    }

    if (invite.accepted) {
      return res.status(200).json({ message: 'Bereits bestätigt', decision_id: invite.decision_id })
    }

    const { error: updateError } = await supabase
      .from('team_members')
      .update({
        user_id: userId,
        decision_id: invite.decision_id,
        accepted: true,
        invite_token: null
      })
      .eq('id', invite.id)

    if (updateError) throw updateError

    res.status(200).json({ message: 'Teilnahme bestätigt', decision_id: invite.decision_id })
  } catch (error) {
    console.error('❌ Fehler beim Akzeptieren:', error)
    res.status(500).json({ error: 'Fehler beim Bestätigen der Einladung' })
  }
})

// ✅ Teammitglieder abrufen
router.get('/team-members/:id', verifyJWT, async (req, res) => {
  const decision_id = req.params.id

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
      .eq('decision_id', decision_id)
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
