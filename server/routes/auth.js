import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { supabase } from '../db.js'

const router = express.Router()

router.post('/register', async (req, res) => {
  const { email, password } = req.body

  const hashedPassword = await bcrypt.hash(password, 10)

  const { error } = await supabase
    .from('users')
    .insert([{ email, password: hashedPassword }])

  if (error) return res.status(400).json({ error: error.message })

  res.status(201).json({ message: '✅ Registration successful' })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error || !user) return res.status(400).json({ error: '❌ Invalid credentials' })

  const isValid = await bcrypt.compare(password, user.password)

  if (!isValid) return res.status(401).json({ error: '❌ Wrong password' })

  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  })

  res.json({ token })
})

export default router
