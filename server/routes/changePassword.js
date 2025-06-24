// server/routes/changePassword.js
import express from 'express'
import jwt from 'jsonwebtoken'
import supabase from '../supabaseClient.js'


const router = express.Router()

router.post('/', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]
  const { newPassword } = req.body

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token und Passwort erforderlich' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const userId = decoded.userId

    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.status(200).json({ message: 'Passwort erfolgreich geändert' })
  } catch (err) {
    res.status(401).json({ error: 'Ungültiger oder abgelaufener Token' })
  }
})

export default router
