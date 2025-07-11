import express from 'express'
import crypto from 'crypto'
import { supabase } from '../db.js'
import verifyJWT from '../middleware/verifyJWT.js'

const router = express.Router()

// 📦 Eigene + akzeptierte Team-Entscheidungen
router.get('/', verifyJWT, async (req, res) => {
  const user_id = req.userId

  try {
    const { data, error } = await supabase
      .from('decisions_with_type')
      .select('*')
      .or(`user_id.eq.${user_id},and(user_id.neq.${user_id},type.eq.team)`)

    if (error) throw error

    const { data: memberships, error: teamError } = await supabase
      .from('team_members')
      .select('decision_id')
      .eq('user_id', user_id)
      .eq('accepted', true)

    if (teamError) throw teamError

    const teamDecisionIds = memberships.map(m => m.decision_id)
    const filtered = data.filter(d =>
      d.user_id === user_id || teamDecisionIds.includes(d.id)
    )

    res.json(filtered)
  } catch (err) {
    console.error('❌ Fehler beim Laden der Entscheidungen:', err.message)
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

// 🔄 Entscheidung + Details aktualisieren
router.put('/:id', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const user_id = req.userId
  const { name, description, mode, type, options, criteria, evaluations } = req.body

  try {
    // Entscheidung aktualisieren
    const { error: updateError } = await supabase
      .from('decisions')
      .update({ name, description, mode, type })
      .eq('id', decision_id)
      .eq('user_id', user_id)
    if (updateError) throw updateError

    // Optionen ersetzen
    let insertedOptions = []
    if (Array.isArray(options)) {
      await supabase.from('options').delete().eq('decision_id', decision_id)
      const optInsert = options.map(o => ({
        id: crypto.randomUUID(),
        name: o.name,
        decision_id
      }))
      const { data, error: optError } = await supabase.from('options').insert(optInsert).select()
      if (optError) throw optError
      insertedOptions = data
    }

    // Kriterien ersetzen
    let insertedCriteria = []
    if (Array.isArray(criteria)) {
      await supabase.from('criteria').delete().eq('decision_id', decision_id)
      const critInsert = criteria.map(c => ({
        id: crypto.randomUUID(),
        name: c.name,
        importance: Number(c.importance),
        decision_id
      }))
      const { data, error: critError } = await supabase.from('criteria').insert(critInsert).select()
      if (critError) throw critError
      insertedCriteria = data
    }

    // Bewertungen ersetzen
    if (Array.isArray(evaluations)) {
      await supabase.from('evaluations').delete().eq('decision_id', decision_id)

      const evalInsert = evaluations.map(e => {
        const option = insertedOptions[e.option_index]
        const criterion = insertedCriteria[e.criterion_index]
        if (!option || !criterion) return null

        return {
          id: crypto.randomUUID(),
          decision_id,
          option_id: option.id,
          criterion_id: criterion.id,
          value: e.value,
          explanation: e.explanation || null
        }
      }).filter(Boolean)

      const { error: evalError } = await supabase.from('evaluations').insert(evalInsert)
      if (evalError) throw evalError
    }

    res.json({ message: '✅ Entscheidung inkl. Optionen, Kriterien & Bewertungen aktualisiert' })
  } catch (err) {
    console.error('❌ Fehler beim Aktualisieren:', err.message)
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

// 📄 Entscheidung + Details abrufen
router.get('/:id/details', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const user_id = req.userId

  try {
    const { data: isOwner } = await supabase
      .from('decisions')
      .select('id')
      .eq('id', decision_id)
      .eq('user_id', user_id)
      .single()

    const { data: isMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('decision_id', decision_id)
      .eq('user_id', user_id)
      .eq('accepted', true)
      .single()

    if (!isOwner && !isMember) {
      return res.status(403).json({ error: 'Kein Zugriff auf diese Entscheidung' })
    }

    const { data: decision } = await supabase
      .from('decisions')
      .select('*')
      .eq('id', decision_id)
      .single()

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
    console.error('❌ Fehler in /details:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// 🧭 Entscheidungstyp abrufen
router.get('/:id/type', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const user_id = req.userId

  try {
    const { data: isOwner } = await supabase
      .from('decisions')
      .select('id')
      .eq('id', decision_id)
      .eq('user_id', user_id)
      .single()

    if (isOwner) return res.json({ is_team: false })

    const { data: isMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('decision_id', decision_id)
      .eq('user_id', user_id)
      .eq('accepted', true)
      .single()

    if (isMember) return res.json({ is_team: true })

    return res.status(403).json({ error: 'Kein Zugriff auf diese Entscheidung' })
  } catch (err) {
    console.error('❌ Fehler in /:id/type:', err.message)
    res.status(500).json({ error: 'Interner Serverfehler' })
  }
})

export default router
