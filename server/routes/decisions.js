import express from 'express'
import crypto from 'crypto'
import { supabase } from '../db.js'
import verifyJWT from '../middleware/verifyJWT.js'

const router = express.Router()

// Alle Entscheidungen eines Nutzers abrufen
router.get('/', verifyJWT, async (req, res) => {
  const user_id = req.userId
  try {
    const { data, error } = await supabase
      .from('decisions')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Entscheidung erstellen
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

// Entscheidung aktualisieren
router.put('/:id', verifyJWT, async (req, res) => {
  const { name, description, mode, type } = req.body
  const user_id = req.userId
  const decision_id = req.params.id
  try {
    const { data, error } = await supabase
      .from('decisions')
      .update({ name, description, mode, type })
      .eq('id', decision_id)
      .eq('user_id', user_id)
      .select()
      .single()
    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Entscheidung löschen
router.delete('/:id', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const user_id = req.userId
  try {
    await supabase.from('evaluations').delete().eq('decision_id', decision_id)
    await supabase.from('options').delete().eq('decision_id', decision_id)
    await supabase.from('criteria').delete().eq('decision_id', decision_id)

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

// Einzelne Entscheidung mit allen Details
router.get('/:id/details', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const user_id = req.userId
  try {
    const { data: decision, error: dError } = await supabase
      .from('decisions')
      .select('*')
      .eq('id', decision_id)
      .eq('user_id', user_id)
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

// Optionen speichern
router.post('/:id/options', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const { options } = req.body

  try {
    await supabase.from('options').delete().eq('decision_id', decision_id)

    const inserts = options.map(opt => ({
      id: opt.id || crypto.randomUUID(),
      name: opt.name || '',
      decision_id
    }))

    const { error } = await supabase.from('options').insert(inserts)
    if (error) throw error

    res.json({ message: 'Optionen gespeichert' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Kriterien speichern
router.post('/:id/criteria', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const { criteria } = req.body

  try {
    await supabase.from('criteria').delete().eq('decision_id', decision_id)

    const inserts = criteria.map(c => ({
      id: c.id || crypto.randomUUID(),
      name: c.name,
      importance: Number(c.importance),
      decision_id
    }))

    const { error } = await supabase.from('criteria').insert(inserts)
    if (error) throw error

    res.json({ message: 'Kriterien gespeichert' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Bewertungen speichern (Index → ID)
router.post('/:id/evaluations', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const { evaluations, options, criteria } = req.body

  try {
    await supabase.from('evaluations').delete().eq('decision_id', decision_id)

    const { data: dbOptions, error: optErr } = await supabase
      .from('options')
      .select('id')
      .eq('decision_id', decision_id)
    const { data: dbCriteria, error: critErr } = await supabase
      .from('criteria')
      .select('id')
      .eq('decision_id', decision_id)

    if (optErr || critErr) throw optErr || critErr

    const inserts = evaluations.map(e => {
      const option_id = dbOptions[e.option_index]?.id
      const criterion_id = dbCriteria[e.criterion_index]?.id
      if (!option_id || !criterion_id) {
        throw new Error('Fehlende option_id oder criterion_id')
      }

      return {
        id: crypto.randomUUID(),
        decision_id,
        option_id,
        criterion_id,
        value: e.value,
        explanation: e.explanation || null
      }
    })

    const { error: insertErr } = await supabase.from('evaluations').insert(inserts)
    if (insertErr) throw insertErr

    res.json({ message: 'Bewertungen gespeichert' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Kommentar speichern
router.post('/:id/comments', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const user_id = req.userId
  const { text } = req.body
  if (!text) return res.status(400).json({ error: 'Text fehlt' })

  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([{ decision_id, user_id, text }])
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Kommentare abrufen
router.get('/:id/comments', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('decision_id', decision_id)
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
