import express from 'express'
import supabase from '../supabaseClient.js'
import jwt from 'jsonwebtoken'

const router = express.Router()

// 🔐 Auth-Middleware
router.use((req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'No token provided' })

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' })
  }
})

// 📩 POST /api/team-decisions
router.post('/', async (req, res) => {
  const { name, description, mode, timer } = req.body
  const userId = req.user.id

  try {
    const { data, error } = await supabase
      .from('decisions')
      .insert([
        {
          name,
          description,
          mode,
          user_id: userId,
          timer: timer || null,
          type: 'team'
        }
      ])
      .select()
      .single()

    if (error) throw error

    return res.status(201).json({ decision: data })
  } catch (err) {
    console.error('❌ Fehler beim Erstellen der Team-Entscheidung:', err.message)
    return res.status(500).json({ error: err.message })
  }
})

export default router
