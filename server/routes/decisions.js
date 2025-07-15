import express from 'express'
import crypto from 'crypto'
import { supabase } from '../db.js'
import verifyJWT from '../middleware/verifyJWT.js'

const router = express.Router()

// 📦 Eigene + akzeptierte Team-Entscheidungen (Dashboard)
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
    res.status(500).json({ error: err.message })
  }
})

// ➕ Entscheidung erstellen (Solo & Team!)
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

// 🔄 Entscheidung + Details aktualisieren (robust, indexbasiert)
router.put('/:id', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const user_id = req.userId
  const { name, description, mode, type, options, criteria, evaluations } = req.body

  // 1. Pflichtfeld-Prüfung
  if (
    !name || !description || !mode || !type ||
    !Array.isArray(options) || options.length === 0 ||
    !Array.isArray(criteria) || criteria.length === 0
  ) {
    return res.status(400).json({
      error: 'Name, Beschreibung, Optionen und Kriterien dürfen nicht leer sein'
    })
  }

  try {
    // 2. Entscheidung aktualisieren
    const { error: updateError } = await supabase
      .from('decisions')
      .update({ name, description, mode, type })
      .eq('id', decision_id)
      .eq('user_id', user_id)
    if (updateError) throw updateError

    // 3. Optionen schreiben (IDs merken für Mapping)
    await supabase.from('options').delete().eq('decision_id', decision_id)
    const optInsert = options.map(o => ({
      id: crypto.randomUUID(),
      name: o.name,
      decision_id
    }))
    const { data: optData, error: optError } = await supabase.from('options').insert(optInsert).select()
    if (optError) throw optError

    // 4. Kriterien schreiben (IDs merken für Mapping)
    await supabase.from('criteria').delete().eq('decision_id', decision_id)
    const critInsert = criteria.map(c => ({
      id: crypto.randomUUID(),
      name: c.name,
      importance: Number(c.importance),
      decision_id
    }))
    const { data: critData, error: critError } = await supabase.from('criteria').insert(critInsert).select()
    if (critError) throw critError

    // 5. Bewertungen sauber mappen
    if (Array.isArray(evaluations)) {
      await supabase.from('evaluations').delete().eq('decision_id', decision_id)
      const evalInsert = evaluations.map(e => {
        // Fallback: nutze Indizes aus Payload
        const option_id = e.option_id || optData?.[e.option_index]?.id
        const criterion_id = e.criterion_id || critData?.[e.criterion_index]?.id
        if (!option_id || !criterion_id) return null
        return {
          id: crypto.randomUUID(),
          decision_id,
          option_id,
          criterion_id,
          value: Number(e.value),
          explanation: e.explanation || null
        }
      }).filter(Boolean)
      if (evalInsert.length > 0) {
        const { error: evalError } = await supabase.from('evaluations').insert(evalInsert)
        if (evalError) throw evalError
      }
    }

    res.json({ message: 'Entscheidung inkl. Optionen, Kriterien & Bewertungen aktualisiert' })
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
    res.json({ message: 'Entscheidung gelöscht' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 📄 Entscheidung + Details abrufen (Solo & Team!)
router.get('/:id/details', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const user_id = req.userId

  try {
    // Entscheidung holen
    const { data: decision, error: decisionErr } = await supabase
      .from('decisions')
      .select('*')
      .eq('id', decision_id)
      .single()

    if (decisionErr || !decision) {
      return res.status(404).json({ error: 'Entscheidung nicht gefunden' })
    }

    // Zugriff prüfen: Owner ODER accepted Teammitglied
    let hasAccess = false
    if (decision.user_id === user_id) {
      hasAccess = true
    } else if (decision.type === 'team') {
      const { data: member } = await supabase
        .from('team_members')
        .select('id')
        .eq('decision_id', decision_id)
        .eq('user_id', user_id)
        .eq('accepted', true)
        .maybeSingle()
      if (member) hasAccess = true
    }
    if (!hasAccess) {
      return res.status(403).json({ error: 'Kein Zugriff auf diese Entscheidung' })
    }

    // Optionen/Kriterien/Evaluations laden
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

// 🧭 Entscheidungstyp abrufen
router.get('/:id/type', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const user_id = req.userId

  try {
    const { data: decision, error } = await supabase
      .from('decisions')
      .select('id, user_id, type')
      .eq('id', decision_id)
      .single()

    if (error || !decision) throw new Error('Entscheidung nicht gefunden')

    const isOwner = decision.user_id === user_id

    let isMember = false
    if (!isOwner) {
      const { data: member } = await supabase
        .from('team_members')
        .select('id')
        .eq('decision_id', decision_id)
        .eq('user_id', user_id)
        .eq('accepted', true)
        .single()

      isMember = !!member
    }

    if (!isOwner && !isMember) {
      return res.status(403).json({ error: 'Kein Zugriff auf diese Entscheidung' })
    }

    const isTeam = decision.type === 'team'
    return res.json({ is_team: isTeam })
  } catch (err) {
    res.status(500).json({ error: 'Interner Serverfehler' })
  }
})

export default router
