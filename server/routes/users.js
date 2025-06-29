// server/routes/users.js
import express from 'express'
import verifyJWT from '../middleware/verifyJWT.js'
import { supabase } from '../db.js'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Benutzerverwaltung
 */

/**
 * @swagger
 * /api/users/create:
 *   post:
 *     summary: Erstellt einen neuen Benutzer in der Supabase-Tabelle
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Benutzer erstellt
 *       400:
 *         description: Fehlende E-Mail
 *       500:
 *         description: Interner Serverfehler
 */
router.post('/create', verifyJWT, async (req, res) => {
  const user_id = req.userId
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ error: 'E-Mail fehlt' })
  }

  const { error } = await supabase
    .from('users')
    .insert([{ id: user_id, email }])

  if (error) {
    console.error('❌ Supabase User Insert Error:', error.message)
    return res.status(500).json({ error: error.message })
  }

  res.json({ message: '✅ Benutzer in Supabase-Tabelle erstellt' })
})

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Lädt das aktuelle Benutzerprofil
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profildaten geladen
 *       500:
 *         description: Fehler beim Laden des Profils
 */
router.get('/me', verifyJWT, async (req, res) => {
  const user_id = req.userId

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, nickname, avatar_url, first_name, last_name, birthday')
      .eq('id', user_id)
      .single()

    if (error) {
      console.error('❌ Fehler beim Laden des Profils:', error.message)
      return res.status(500).json({ error: 'Profil konnte nicht geladen werden' })
    }

    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * @swagger
 * /api/users/update:
 *   put:
 *     summary: Aktualisiert das Benutzerprofil
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname:
 *                 type: string
 *               avatar_url:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               birthday:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Profil aktualisiert
 *       500:
 *         description: Fehler beim Speichern
 */
router.put('/update', verifyJWT, async (req, res) => {
  const user_id = req.userId
  const allowedFields = ['nickname', 'avatar_url', 'first_name', 'last_name', 'birthday']

  const updateData = {}
  for (const key of allowedFields) {
    if (key in req.body && req.body[key] !== null && req.body[key] !== '') {
      updateData[key] = req.body[key]
    }
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: 'Keine gültigen Felder zum Aktualisieren gesendet' })
  }

  try {
    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user_id)

    if (error) {
      console.error('❌ Fehler beim Speichern des Profils:', error.message)
      return res.status(500).json({ error: 'Profil konnte nicht gespeichert werden' })
    }

    res.json({ message: '✅ Profil gespeichert' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
