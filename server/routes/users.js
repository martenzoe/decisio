// server/routes/users.js
import express from 'express'
import verifyJWT from '../middleware/verifyJWT.js'
import { supabaseAdmin } from '../supabaseClient.js'
import multer from 'multer'
import mime from 'mime-types'

const router = express.Router()

/* ----------------- bestehende Endpunkte ----------------- */

router.post('/create', verifyJWT, async (req, res) => {
  const user_id = req.userId
  const { email } = req.body

  if (!user_id) return res.status(401).json({ error: 'Unauthorized' })
  if (!email) return res.status(400).json({ error: 'E-Mail fehlt' })

  const { error } = await supabaseAdmin.from('users').insert([{ id: user_id, email }])
  if (error) return res.status(500).json({ error: error.message })

  res.json({ message: '✅ Benutzer in Supabase-Tabelle erstellt' })
})

router.get('/me', verifyJWT, async (req, res) => {
  const user_id = req.userId
  if (!user_id) return res.status(401).json({ error: 'Unauthorized' })

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, email, nickname, avatar_url, first_name, last_name, birthday')
    .eq('id', user_id)
    .single()

  if (error) return res.status(500).json({ error: 'Profil konnte nicht geladen werden' })
  res.json(data)
})

router.put('/update', verifyJWT, async (req, res) => {
  const user_id = req.userId
  if (!user_id) return res.status(401).json({ error: 'Unauthorized' })

  const allowedFields = ['nickname', 'avatar_url', 'first_name', 'last_name', 'birthday']
  const updateData = {}
  for (const key of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      const val = req.body[key]
      if (val !== undefined && val !== null && val !== '') updateData[key] = val
    }
  }
  if (!Object.keys(updateData).length) {
    return res.status(400).json({ error: 'Keine gültigen Felder zum Aktualisieren gesendet' })
  }

  const { error } = await supabaseAdmin.from('users').update(updateData).eq('id', user_id)
  if (error) return res.status(500).json({ error: 'Profil konnte nicht gespeichert werden' })
  res.json({ message: '✅ Profil gespeichert' })
})

/* ----------------- NEU: Avatar-Upload (Service-Role) ----------------- */

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
})

router.post('/avatar', verifyJWT, upload.single('file'), async (req, res) => {
  try {
    const user_id = req.userId
    if (!user_id) return res.status(401).json({ error: 'Unauthorized' })
    if (!req.file) return res.status(400).json({ error: 'No file uploaded (field "file" missing).' })

    const bucket = 'avatars' // Bucket muss existieren; public empfohlen
    const ext = mime.extension(req.file.mimetype) || 'bin'
    const filePath = `${user_id}/${Date.now()}.${ext}`

    // Datei hochladen
    const { error: upErr } = await supabaseAdmin
      .storage
      .from(bucket)
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      })

    if (upErr) {
      console.error('❌ Storage upload error:', upErr.message)
      return res.status(500).json({ error: `Storage upload failed: ${upErr.message}` })
    }

    // öffentliche URL holen
    const { data: pub } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath)
    const publicUrl = pub?.publicUrl
    if (!publicUrl) {
      return res.status(500).json({ error: 'Could not resolve public URL. Is the bucket public?' })
    }

    // URL ins Profil speichern (ohne limit())
    const { error: updErr } = await supabaseAdmin
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', user_id)

    if (updErr) {
      console.error('❌ Profile update error:', updErr.message)
      return res.status(500).json({ error: 'Profilbild-URL konnte nicht gespeichert werden' })
    }

    res.json({ message: '✅ Avatar updated', url: publicUrl, path: filePath })
  } catch (err) {
    console.error('❌ Avatar route error:', err)
    res.status(500).json({ error: 'Unexpected error during avatar upload' })
  }
})

export default router
