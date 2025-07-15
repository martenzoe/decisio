import express from 'express'
import { supabase } from '../db.js'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const router = express.Router()

// Auth Middleware
router.use((req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'No token provided' })
  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' })
  }
})

// POST /api/team-decisions (Team-Erstellung)
router.post('/', async (req, res) => {
  console.log('🟢 Rohdaten aus req.body:', req.body)
  const { name, description, mode, timer, options = [], criteria = [], evaluations = [] } = req.body
  const userId = req.userId

  try {
    // Entscheidung anlegen
    const { data: decision, error: decisionError } = await supabase
      .from('decisions')
      .insert([{ name, description, mode, user_id: userId, type: 'team' }])
      .select()
      .single()
    if (decisionError) throw decisionError
    const decisionId = decision.id

    // Team-Meta anlegen
    const { error: teamError } = await supabase
      .from('team_decisions')
      .insert([{ decision_id: decisionId, timer: timer || null, created_by: userId }])
    if (teamError) throw teamError

    // Creator als Teammitglied
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .insert([{
        decision_id: decisionId,
        user_id: userId,
        role: 'owner',
        invited_by: userId,
        accepted: true
      }])
      .select('invite_token')
      .single()
    if (memberError) throw memberError

    // Optionen robust parsen
    const filteredOptions = (options || [])
      .map((o) => {
        if (!o) return null
        if (typeof o === 'string') return o.trim()
        if (typeof o === 'object' && o.name) return o.name.trim()
        return null
      })
      .filter((name) => typeof name === 'string' && name !== '')
      .map((name) => ({
        id: crypto.randomUUID(),
        name,
        decision_id: decisionId
      }))

    console.log('🌐 Optionen zum Insert:', filteredOptions)

    const { data: optionData, error: optionErr } = await supabase
      .from('options')
      .insert(filteredOptions)
      .select()
    if (optionErr) throw optionErr

    console.log('🌐 Optionen nach Insert:', optionData)

    // Kriterien robust parsen
    const filteredCriteria = (criteria || [])
      .filter((c) => c && typeof c.name === 'string' && c.name.trim() !== '')
      .map((c) => ({
        id: crypto.randomUUID(),
        name: c.name.trim(),
        importance: Number(c.importance) || 0,
        decision_id: decisionId
      }))

    console.log('🌐 Kriterien zum Insert:', filteredCriteria)

    const { data: critData, error: critErr } = await supabase
      .from('criteria')
      .insert(filteredCriteria)
      .select()
    if (critErr) throw critErr

    console.log('🌐 Kriterien nach Insert:', critData)

    // Bewertungen: index → ID auflösen
    const evalInsert = (evaluations || []).map((e) => {
      const optName = e.option_name || options[e.option_index]?.name || options[e.option_index]
      const critName = e.criterion_name || criteria[e.criterion_index]?.name
      const option = optionData?.find((o) =>
        o.name.trim().toLowerCase() === String(optName).trim().toLowerCase()
      )
      const criterion = critData?.find((c) =>
        c.name.trim().toLowerCase() === String(critName).trim().toLowerCase()
      )
      if (!option || !criterion) {
        console.warn('⚠️ Option oder Kriterium nicht gefunden für evaluation:', { optName, critName })
        return null
      }
      return {
        id: crypto.randomUUID(),
        decision_id: decisionId,
        option_id: option.id,
        criterion_id: criterion.id,
        value: Number(e.value),
        explanation: e.explanation || null
      }
    }).filter(Boolean)

    console.log('🌐 evaluations zum Insert:', evalInsert)

    if (evalInsert.length > 0) {
      const { error: evalError } = await supabase.from('evaluations').insert(evalInsert)
      if (evalError) throw evalError
    } else {
      console.warn('⚠️ Keine Bewertungen zu speichern.')
    }

    // Debug-Ausgabe Endstand
    console.log('✅ Entscheidung:', decision)
    console.log('✅ Optionen:', optionData)
    console.log('✅ Kriterien:', critData)
    console.log('✅ Bewertungen:', evalInsert)

    return res.status(201).json({
      decision: { id: decisionId },
      invite_token: member.invite_token
    })
  } catch (err) {
    console.error('❌ Fehler:', err)
    return res.status(500).json({ error: 'Serverfehler: ' + err.message })
  }
})

export default router
