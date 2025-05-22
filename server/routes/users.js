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

export default router
