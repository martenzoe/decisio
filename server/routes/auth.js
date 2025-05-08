import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import supabase from '../supabaseClient.js'

const router = express.Router()

// Registrierung
router.post('/register', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  // Existiert der User bereits?
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (existingUser) {
    return res.status(400).json({ error: 'User already exists' })
  }

  // Passwort hashen
  const hashed = await bcrypt.hash(password, 10)

  // In Supabase DB speichern
  const { error } = await supabase
    .from('users')
    .insert({ email, password: hashed })

  if (error) {
    return res.status(500).json({ error: 'Error creating user' })
  }

  res.status(201).json({ message: 'User registered successfully' })
})

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const isValid = await bcrypt.compare(password, user.password)

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )

  res.json({ token })
})

export default router
