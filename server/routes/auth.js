import express from 'express'
import { supabase } from '../db.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'

const router = express.Router()

// 🔐 Registrierung
router.post('/register', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich' })
  }

  try {
    // ✅ Existiert E-Mail schon?
    const { data: existingUser, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return res.status(409).json({ error: '❌ E-Mail ist bereits registriert' })
    }

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('🔍 Supabase-Fehler bei Prüfung:', existingError.message)
      return res.status(500).json({ error: 'Interner Fehler bei Prüfung' })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    const id = crypto.randomUUID()

    const { error: insertError } = await supabase
      .from('users')
      .insert([{ id, email, password: hashedPassword }])

    if (insertError) {
      console.error('❌ Supabase-Fehler beim Insert:', insertError.message)
      return res.status(500).json({ error: 'Registrierung fehlgeschlagen' })
    }

    console.log('✅ Neuer Nutzer registriert:', email)
    res.status(201).json({ message: 'Registrierung erfolgreich' })
  } catch (err) {
    console.error('❌ Unerwarteter Fehler:', err.message)
    res.status(500).json({ error: 'Interner Serverfehler' })
  }
})

// 🔑 Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich' })
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      return res.status(401).json({ error: '❌ Nutzer nicht gefunden' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ error: '❌ Passwort falsch' })
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    })

    console.log('🔓 Login erfolgreich:', email)
    res.json({ token })
  } catch (err) {
    console.error('❌ Fehler beim Login:', err.message)
    res.status(500).json({ error: 'Interner Serverfehler' })
  }
})

export default router
