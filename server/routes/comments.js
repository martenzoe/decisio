import express from 'express'
import supabase from '../supabaseClient.js'
import jwt from 'jsonwebtoken'

const router = express.Router()

// Tokenprüfung
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token provided' })

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' })
    req.user = decoded
    next()
  })
}

// Kommentare abrufen mit Benutzerinformationen
router.get('/:decisionId', verifyToken, async (req, res) => {
  const { decisionId } = req.params

  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        text,
        created_at,
        user_id,
        users (
          nickname,
          avatar_url
        )
      `)
      .eq('decision_id', decisionId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Fehler beim Abrufen der Kommentare:', error)
      return res.status(500).json({ error: error.message })
    }

    // 🐞 Debug-Ausgabe zur Überprüfung der users-Einbettung
    console.log('RAW KOMMENTARE:', JSON.stringify(data, null, 2))

    // Benutzerinfos ins Root-Level mappen
    const formatted = (data || []).map(c => ({
      ...c,
      nickname: c.users?.nickname || 'Anonym',
      avatar_url: c.users?.avatar_url || null
    }))

    res.json(formatted)
  } catch (err) {
    console.error('❌ Unerwarteter Fehler:', err)
    res.status(500).json({ error: err.message })
  }
})

// Kommentar erstellen
router.post('/', verifyToken, async (req, res) => {
  const { decision_id, text } = req.body
  const user_id = req.user.userId  // 🔧 Korrektur hier

  const { data, error } = await supabase
    .from('comments')
    .insert([{ decision_id, user_id, text }])
    .select('id, text, created_at, user_id')
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

// Kommentar bearbeiten
router.put('/:commentId', verifyToken, async (req, res) => {
  const { commentId } = req.params
  const { text } = req.body
  const user_id = req.user.userId  // 🔧 Korrektur hier

  const { data, error } = await supabase
    .from('comments')
    .update({ text })
    .eq('id', commentId)
    .eq('user_id', user_id)
    .select('id, text, created_at, user_id')
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// Kommentar löschen
router.delete('/:commentId', verifyToken, async (req, res) => {
  const { commentId } = req.params
  const user_id = req.user.userId  // 🔧 Korrektur hier

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user_id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ message: 'Kommentar gelöscht' })
})

export default router
