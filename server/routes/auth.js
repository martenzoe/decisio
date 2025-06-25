import express from 'express'
import { supabase } from '../db.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'

const router = express.Router()

router.post('/register', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich' })
  }

  try {
    const { data: existingUser } = await supabase
      .from('users').select('id').eq('email', email).single()
    if (existingUser) return res.status(409).json({ error: 'E-Mail schon registriert' })

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    const id = crypto.randomUUID()

    const { error: insertError } = await supabase
      .from('users')
      .insert([{ id, email, password: hashedPassword, supabase_user_id: id }])
    if (insertError) return res.status(500).json({ error: 'Registrierung fehlgeschlagen' })

    res.status(201).json({ message: '✅ Account erstellt' })
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ error: 'Serverfehler' })
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich' })
  }

  try {
    const { data: user, error } = await supabase
      .from('users').select('id, email, password, nickname, avatar_url').eq('email', email).single()
    if (error || !user) return res.status(401).json({ error: 'Nutzer nicht gefunden' })

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return res.status(401).json({ error: 'Passwort falsch' })

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
      },
    })
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ error: 'Serverfehler' })
  }
})

export default router
