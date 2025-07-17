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

// POST /api/team-decisions (Team-Erstellung, nur Basisdaten)
router.post('/', async (req, res) => {
  const { name, description, mode, timer, options = [], criteria = [] } = req.body
  const userId = req.userId

  try {
    // Entscheidung anlegen (Basisdaten)
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

    // Creator als Teammitglied (Owner)
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

    // Optionen (nur wenn vorhanden und ausgefüllt)
    let optionData = []
    if (Array.isArray(options) && options.length) {
      const filteredOptions = options
        .map(o => typeof o === 'string'
          ? o.trim()
          : (o && o.name ? o.name.trim() : null))
        .filter(Boolean)
        .map(name => ({
          id: crypto.randomUUID(),
          name,
          decision_id: decisionId
        }))
      if (filteredOptions.length) {
        const { data, error } = await supabase
          .from('options')
          .insert(filteredOptions)
          .select()
        if (error) throw error
        optionData = data
      }
    }

    // Kriterien (nur wenn vorhanden und ausgefüllt)
    if (Array.isArray(criteria) && criteria.length) {
      const filteredCriteria = criteria
        .filter(c => c && typeof c.name === 'string' && c.name.trim() !== '')
        .map(c => ({
          id: crypto.randomUUID(),
          name: c.name.trim(),
          importance: Number(c.importance) || 0,
          decision_id: decisionId
        }))
      if (filteredCriteria.length) {
        const { error } = await supabase
          .from('criteria')
          .insert(filteredCriteria)
        if (error) throw error
      }

      // Nach dem Kriterien-Insert: Eigene Standard-Gewichtungen für den Creator setzen
      const { data: createdCriteria, error: critFetchError } = await supabase
        .from('criteria')
        .select('id')
        .eq('decision_id', decisionId)
      if (critFetchError) throw critFetchError

      const weights = createdCriteria.map((c, idx) => ({
        id: crypto.randomUUID(),
        decision_id: decisionId,
        user_id: userId,
        criterion_id: c.id,
        weight: typeof criteria[idx].importance === 'number'
          ? criteria[idx].importance
          : (criteria[idx].importance ? Number(criteria[idx].importance) : 0)
      }))
      if (weights.length) {
        const { error: wErr } = await supabase
          .from('criterion_weights')
          .insert(weights)
        if (wErr) throw wErr
      }
    }

    // Keine Bewertungen/Evaluations – das passiert später im Edit/Detail-Prozess

    return res.status(201).json({
      decision: { id: decisionId },
      invite_token: member.invite_token
    })
  } catch (err) {
    return res.status(500).json({ error: 'Serverfehler: ' + err.message })
  }
})

export default router
