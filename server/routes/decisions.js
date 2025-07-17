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

// 🔄 Entscheidung + Details aktualisieren (optimiert)
router.put('/:id', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const user_id = req.userId
  const { name, description = '', mode = 'manual', type = 'private', options = [], criteria = [] } = req.body

  if (!name) {
    return res.status(400).json({ error: 'Name (Titel) darf nicht leer sein' })
  }

  try {
    // Entscheidung aktualisieren
    const { error: updateError } = await supabase
      .from('decisions')
      .update({ name, description, mode, type })
      .eq('id', decision_id)
      .eq('user_id', user_id)
    if (updateError) throw updateError

    // Optionen synchronisieren
    const { data: oldOptions, error: optFetchErr } = await supabase
      .from('options')
      .select('*')
      .eq('decision_id', decision_id)
    if (optFetchErr) throw optFetchErr

    const frontendOptNames = options.map(o => o.name.trim().toLowerCase())
    const oldOptNames = oldOptions.map(o => o.name.trim().toLowerCase())

    const toDeleteOpts = oldOptions.filter(
      o => !frontendOptNames.includes(o.name.trim().toLowerCase())
    )
    const toAddOpts = options.filter(
      o => !oldOptNames.includes(o.name.trim().toLowerCase())
    )
    // Lösche alte Optionen (inkl. Bewertungen)
    for (const o of toDeleteOpts) {
      await supabase.from('evaluations').delete().eq('option_id', o.id)
      await supabase.from('options').delete().eq('id', o.id)
    }
    // Füge neue Optionen ein
    if (toAddOpts.length) {
      const inserts = toAddOpts.map(o => ({
        id: crypto.randomUUID(),
        name: o.name.trim(),
        decision_id
      }))
      const { error: optError } = await supabase.from('options').insert(inserts)
      if (optError) throw optError
    }

    // Kriterien synchronisieren
    const { data: oldCriteria, error: critFetchErr } = await supabase
      .from('criteria')
      .select('*')
      .eq('decision_id', decision_id)
    if (critFetchErr) throw critFetchErr

    const frontendCritNames = criteria.map(c => c.name.trim().toLowerCase())
    const oldCritNames = oldCriteria.map(c => c.name.trim().toLowerCase())

    const toDeleteCrit = oldCriteria.filter(
      c => !frontendCritNames.includes(c.name.trim().toLowerCase())
    )
    const toAddCrit = criteria.filter(
      c => !oldCritNames.includes(c.name.trim().toLowerCase())
    )
    // Lösche alte Kriterien (inkl. Bewertungen & Gewichte)
    for (const c of toDeleteCrit) {
      await supabase.from('evaluations').delete().eq('criterion_id', c.id)
      await supabase.from('criterion_weights').delete().eq('criterion_id', c.id)
      await supabase.from('criteria').delete().eq('id', c.id)
    }
    // Füge neue Kriterien ein
    if (toAddCrit.length) {
      const inserts = toAddCrit.map(c => ({
        id: crypto.randomUUID(),
        name: c.name.trim(),
        importance: typeof c.importance === 'number' ? c.importance : (c.importance ? Number(c.importance) : 0),
        decision_id
      }))
      const { error: critError } = await supabase.from('criteria').insert(inserts)
      if (critError) throw critError
    }
    // Update bestehende Kriterien (z.B. importance)
    for (const c of criteria) {
      const old = oldCriteria.find(oc => oc.name.trim().toLowerCase() === c.name.trim().toLowerCase())
      if (old) {
        await supabase.from('criteria').update({
          importance: typeof c.importance === 'number' ? c.importance : (c.importance ? Number(c.importance) : 0)
        }).eq('id', old.id)
      }
    }

    res.json({ message: 'Entscheidung inkl. Optionen & Kriterien aktualisiert' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 🗑️ Entscheidung löschen (Solo & Team, nur Owner/Admin)
router.delete('/:id', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const user_id = req.userId

  try {
    const { data: decision, error: findErr } = await supabase
      .from('decisions')
      .select('*')
      .eq('id', decision_id)
      .single()
    if (findErr || !decision) return res.status(404).json({ error: 'Entscheidung nicht gefunden' })

    let canDelete = false
    if (decision.type === 'team') {
      const { data: member } = await supabase
        .from('team_members')
        .select('role')
        .eq('decision_id', decision_id)
        .eq('user_id', user_id)
        .maybeSingle()
      canDelete = (decision.user_id === user_id) ||
                  (member && ['owner', 'admin'].includes(member.role))
    } else {
      canDelete = (decision.user_id === user_id)
    }
    if (!canDelete) {
      return res.status(403).json({ error: 'Kein Löschrecht für diese Entscheidung' })
    }
    await supabase.from('evaluations').delete().eq('decision_id', decision_id)
    await supabase.from('criterion_weights').delete().eq('decision_id', decision_id)
    await supabase.from('options').delete().eq('decision_id', decision_id)
    await supabase.from('criteria').delete().eq('decision_id', decision_id)
    await supabase.from('comments').delete().eq('decision_id', decision_id)
    await supabase.from('team_members').delete().eq('decision_id', decision_id)
    await supabase.from('team_decisions').delete().eq('decision_id', decision_id)
    const { error } = await supabase
      .from('decisions')
      .delete()
      .eq('id', decision_id)
    if (error) throw error
    res.json({ message: 'Entscheidung + alle Daten wurden gelöscht' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 📄 Entscheidung + Details abrufen – erweitert um teamMembers
router.get('/:id/details', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const user_id = req.userId

  try {
    const { data: decision, error: decisionErr } = await supabase
      .from('decisions')
      .select('*')
      .eq('id', decision_id)
      .single()

    if (decisionErr || !decision) {
      return res.status(404).json({ error: 'Entscheidung nicht gefunden' })
    }

    let userRole = 'owner'
    let hasAccess = false

    if (decision.type === 'team') {
      const { data: member } = await supabase
        .from('team_members')
        .select('role, accepted')
        .eq('decision_id', decision_id)
        .eq('user_id', user_id)
        .maybeSingle()
      if (member && member.accepted) {
        userRole = member.role
        hasAccess = true
      }
      if (decision.user_id === user_id) {
        userRole = 'owner'
        hasAccess = true
      }
    } else {
      hasAccess = (decision.user_id === user_id)
    }
    if (!hasAccess) {
      return res.status(403).json({ error: 'Kein Zugriff auf diese Entscheidung' })
    }

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

    const { data: allWeights } = await supabase
      .from('criterion_weights')
      .select('user_id, criterion_id, weight')
      .eq('decision_id', decision_id)

    const weightsByUser = {}
    if (Array.isArray(allWeights)) {
      allWeights.forEach(w => {
        if (!weightsByUser[w.user_id]) weightsByUser[w.user_id] = []
        weightsByUser[w.user_id].push({ criterion_id: w.criterion_id, weight: w.weight })
      })
    }

    // 🚀 Teammitglieder laden
    const { data: teamMembers, error: teamError } = await supabase
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
      .eq('decision_id', decision_id)

    if (teamError) {
      console.error('Fehler beim Laden der Teammitglieder:', teamError)
      return res.status(500).json({ error: 'Fehler beim Laden der Teammitglieder' })
    }

    res.json({
      decision,
      options,
      criteria,
      evaluations,
      userRole,
      weightsByUser,
      teamMembers
    })
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

// 🧮 Einzel-Bewertungen speichern
router.post('/:id/evaluate', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const user_id = req.userId
  const { evaluations } = req.body

  let userRole = 'owner'
  const { data: decision, error: decisionErr } = await supabase
    .from('decisions')
    .select('*')
    .eq('id', decision_id)
    .single()

  if (decisionErr || !decision) {
    return res.status(404).json({ error: 'Entscheidung nicht gefunden' })
  }

  if (decision.type === 'team') {
    const { data: member } = await supabase
      .from('team_members')
      .select('role, accepted')
      .eq('decision_id', decision_id)
      .eq('user_id', user_id)
      .maybeSingle()
    if (member && member.accepted) {
      userRole = member.role
    }
    if (decision.user_id === user_id) {
      userRole = 'owner'
    }
    if (userRole === 'viewer') {
      return res.status(403).json({ error: 'Viewer dürfen keine Bewertung abgeben' })
    }
  } else {
    if (decision.user_id !== user_id) {
      return res.status(403).json({ error: 'Kein Zugriff' })
    }
  }

  try {
    await supabase
      .from('evaluations')
      .delete()
      .eq('decision_id', decision_id)
      .eq('user_id', user_id)

    if (Array.isArray(evaluations) && evaluations.length > 0) {
      const evalInsert = evaluations.map(e => ({
        id: crypto.randomUUID(),
        decision_id,
        user_id,
        option_id: e.option_id,
        criterion_id: e.criterion_id,
        value: Number(e.value)
      }))
      const { error } = await supabase.from('evaluations').insert(evalInsert)
      if (error) throw error
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 🏋️‍♂️ Kriteriengewichte laden
router.get('/:id/weights', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const user_id = req.userId
  try {
    const { data: weights, error } = await supabase
      .from('criterion_weights')
      .select('*')
      .eq('decision_id', decision_id)
      .eq('user_id', user_id)
    if (error) throw error
    res.json({ weights })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 🏗️ Kriteriengewichte speichern
router.post('/:id/weights', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const user_id = req.userId
  const { weights } = req.body
  if (!Array.isArray(weights)) return res.status(400).json({ error: 'No weights submitted.' })
  try {
    await supabase
      .from('criterion_weights')
      .delete()
      .eq('decision_id', decision_id)
      .eq('user_id', user_id)
    if (weights.length) {
      const insert = weights.map(w => ({
        id: crypto.randomUUID(),
        decision_id,
        user_id,
        criterion_id: w.criterion_id,
        weight: Number(w.weight)
      }))
      const { error } = await supabase.from('criterion_weights').insert(insert)
      if (error) throw error
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
