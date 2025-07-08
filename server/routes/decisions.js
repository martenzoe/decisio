// server/routes/decision.js

import express from 'express'
import crypto from 'crypto'
import { supabase } from '../db.js'
import verifyJWT from '../middleware/verifyJWT.js'

const router = express.Router()

// 📦 Eigene + akzeptierte Team-Entscheidungen
router.get('/', verifyJWT, async (req, res) => {
  const user_id = req.userId
  console.log('📥 GET /api/decision für User:', user_id)

  try {
    // Eigene Entscheidungen
    const { data: own, error: ownError } = await supabase
      .from('decisions')
      .select('*')
      .eq('user_id', user_id)

    if (ownError) throw ownError
    console.log(`➡️ Eigene Entscheidungen (${own.length}):`, own.map(d => d.name))

    // Team-Entscheidungen
    const { data: team, error: teamError } = await supabase
      .from('decisions')
      .select('*, team_members!inner(user_id, accepted)')
      .eq('team_members.user_id', user_id)
      .eq('team_members.accepted', true)

    if (teamError) throw teamError
    console.log(`➡️ Team-Entscheidungen (${team.length}):`, team.map(d => d.name))

    // Duplikate entfernen
    const all = [...own, ...team].filter(
      (v, i, a) => a.findIndex(t => t.id === v.id) === i
    )

    console.log(`✅ Gesamtanzahl Entscheidungen: ${all.length}`)
    res.json(all)
  } catch (err) {
    console.error('❌ Fehler beim Laden der Entscheidungen:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// 👥 Nur Team-Entscheidungen
router.get('/my', verifyJWT, async (req, res) => {
  const user_id = req.userId
  try {
    const { data, error } = await supabase
      .from('decisions')
      .select('*, team_members!inner(user_id, accepted)')
      .eq('team_members.user_id', user_id)
      .eq('team_members.accepted', true)

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ➕ Entscheidung erstellen
router.post('/', verifyJWT, async (req, res) => {
  const { name, description, mode = 'manual', type = 'private' } = req.body
  const user_id = req.userId
  try {
    const { data, error } = await supabase
      .from('decisions')
      .insert([{ name, description, mode, type, user_id }])
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ✏️ Optionen speichern
router.post('/:id/options', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const { options } = req.body
  try {
    await supabase.from('options').delete().eq('decision_id', decision_id)
    const inserts = options.map(o => ({
      id: crypto.randomUUID(),
      name: o.name,
      decision_id,
    }))
    const { data, error } = await supabase.from('options').insert(inserts).select()
    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ✏️ Kriterien speichern
router.post('/:id/criteria', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const { criteria } = req.body
  try {
    await supabase.from('criteria').delete().eq('decision_id', decision_id)
    const inserts = criteria.map(c => ({
      id: crypto.randomUUID(),
      name: c.name,
      importance: Number(c.importance),
      decision_id,
    }))
    const { data, error } = await supabase.from('criteria').insert(inserts).select()
    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 🧮 Bewertungen speichern
router.post('/:id/evaluations', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const { evaluations } = req.body
  try {
    await supabase.from('evaluations').delete().eq('decision_id', decision_id)
    const inserts = evaluations.map(e => ({
      id: crypto.randomUUID(),
      decision_id,
      option_id: e.option_id,
      criterion_id: e.criterion_id,
      value: e.value,
      explanation: e.explanation || null,
    }))
    const { error } = await supabase.from('evaluations').insert(inserts)
    if (error) throw error
    res.json({ message: '✅ Bewertungen gespeichert' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 🔄 Entscheidung aktualisieren
router.put('/:id', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const user_id = req.userId
  const { name, description, mode, type } = req.body
  try {
    const { error } = await supabase
      .from('decisions')
      .update({ name, description, mode, type })
      .eq('id', decision_id)
      .eq('user_id', user_id)

    if (error) throw error
    res.json({ message: '✅ Entscheidung aktualisiert' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 🗑️ Entscheidung löschen
router.delete('/:id', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const user_id = req.userId
  try {
    await supabase.from('evaluations').delete().eq('decision_id', decision_id)
    await supabase.from('options').delete().eq('decision_id', decision_id)
    await supabase.from('criteria').delete().eq('decision_id', decision_id)
    await supabase.from('comments').delete().eq('decision_id', decision_id)
    await supabase.from('team_members').delete().eq('decision_id', decision_id)

    const { error } = await supabase
      .from('decisions')
      .delete()
      .eq('id', decision_id)
      .eq('user_id', user_id)

    if (error) throw error
    res.json({ message: '✅ Entscheidung gelöscht' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 📄 Einzelne Entscheidung + Details
router.get('/:id/details', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  try {
    const { data: decision, error: dError } = await supabase
      .from('decisions')
      .select('*')
      .eq('id', decision_id)
      .single()
    if (dError) throw dError

    const { data: options } = await supabase
      .from('options')
      .select('*')
      .eq('decision_id', decision_id)

    const { data: criteria } = await supabase
      .from('criteria')
      .select('*')
      .eq('decision_id', decision_id)

    const { data: evaluations } = await supabase
      .from('evaluations')
      .select('*')
      .eq('decision_id', decision_id)

    res.json({ decision, options, criteria, evaluations })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
