// server/routes/notifications.js
import express from 'express'
import verifyJWT from '../middleware/verifyJWT.js'
import supabase from '../supabaseClient.js'

const router = express.Router()

// ✅ GET /api/notifications – Alle Benachrichtigungen für eingeloggten Nutzer
router.get('/', verifyJWT, async (req, res) => {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: 'Kein userId vorhanden' })

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id,
        message,
        link,
        read,
        created_at,
        decision_id,
        inviter_id,
        users:inviter_id (nickname)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('📛 Supabase Error:', error)
      return res.status(500).json({ error: error.message })
    }

    res.json(data)
  } catch (err) {
    console.error('❌ Serverfehler:', err)
    res.status(500).json({ error: 'Interner Serverfehler' })
  }
})

// ✅ POST /api/notifications – Neue Notification hinzufügen
router.post('/', verifyJWT, async (req, res) => {
  const { user_id, message, link, decision_id, inviter_id } = req.body

  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{ user_id, message, link, decision_id, inviter_id, read: false }])

    if (error) return res.status(500).json({ error: error.message })

    res.status(201).json(data[0])
  } catch (err) {
    console.error('❌ Fehler beim Insert:', err)
    res.status(500).json({ error: 'Insert fehlgeschlagen' })
  }
})

// ✅ PUT /api/notifications/:id/read – Als gelesen markieren
router.put('/:id/read', verifyJWT, async (req, res) => {
  const { id } = req.params

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)

    if (error) return res.status(500).json({ error: error.message })

    res.json({ success: true })
  } catch (err) {
    console.error('❌ Fehler beim Update:', err)
    res.status(500).json({ error: 'Update fehlgeschlagen' })
  }
})

export default router
