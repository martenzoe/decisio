// server/routes/decisions.js
import express from 'express'
import { supabase } from '../db.js'
import verifyJWT from '../middleware/verifyJWT.js'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Decisions
 *   description: Entscheidungsmanagement
 */

/**
 * @swagger
 * /api/decision:
 *   post:
 *     summary: Erstellt eine neue Entscheidung
 *     tags: [Decisions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               mode:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Entscheidung erstellt
 *       500:
 *         description: Interner Serverfehler
 */


// ✅ Entscheidung erstellen
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

// ✅ Entscheidung aktualisieren
router.put('/:id', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const user_id = req.userId
  const { name, description, mode, type } = req.body

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

// 🗑️ Entscheidung löschen
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

// ✅ Entscheidungen abrufen
router.get('/', verifyJWT, async (req, res) => {
  const user_id = req.userId

  try {
    const { data, error } = await supabase
      .from('decisions')
      .select('*')
      .eq('user_id', user_id)

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ✅ Einzelne Entscheidung mit Optionen, Kriterien und Bewertungen
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

// ✅ Optionen speichern
router.post('/:id/options', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const { options } = req.body

  const inserts = options.map(name => ({ name, decision_id }))
  const { error } = await supabase.from('options').insert(inserts)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ message: 'Optionen gespeichert' })
})

// ✅ Kriterien speichern
router.post('/:id/criteria', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const { criteria } = req.body

  const inserts = criteria.map(c => ({
    name: c.name,
    importance: Number(c.importance),
    decision_id,
  }))

  const { error } = await supabase.from('criteria').insert(inserts)
  if (error) return res.status(500).json({ error: error.message })

  res.json({ message: 'Kriterien gespeichert' })
})

// ✅ Bewertungen speichern inkl. Erklärung (GPT)
router.post('/:id/evaluations', verifyJWT, async (req, res) => {
  const decision_id = req.params.id
  const { evaluations, options, criteria } = req.body

  try {
    const { data: dbOptions } = await supabase
      .from('options')
      .select('id')
      .eq('decision_id', decision_id)

    const { data: dbCriteria } = await supabase
      .from('criteria')
      .select('id')
      .eq('decision_id', decision_id)

    await supabase.from('evaluations').delete().eq('decision_id', decision_id)

    const inserts = evaluations.map(ev => ({
      decision_id,
      option_id: dbOptions[ev.option_index]?.id,
      criterion_id: dbCriteria[ev.criterion_index]?.id,
      value: ev.value,
      explanation: ev.explanation || null // 🆕 GPT-Erklärung, falls vorhanden
    })).filter(e => e.option_id && e.criterion_id)

    const { error } = await supabase.from('evaluations').insert(inserts)
    if (error) throw error

    res.json({ message: '✅ Bewertungen gespeichert' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})



// 📥 Kommentar speichern
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

// 📤 Kommentare abrufen
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
