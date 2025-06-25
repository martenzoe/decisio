import express from 'express'
import jwt from 'jsonwebtoken'
import supabase from '../supabaseClient.js'

const router = express.Router()

// Passwortregeln: mind. 8 Zeichen, 1 Großbuchstabe
const validatePassword = (password) => {
  const minLength = 8
  const hasUpperCase = /[A-Z]/.test(password)
  return password.length >= minLength && hasUpperCase
}

router.post('/', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]
  const { oldPassword, newPassword } = req.body

  console.log('📥 Anfrage empfangen:', {
    oldPasswordPresent: !!oldPassword,
    newPasswordPresent: !!newPassword,
    tokenPresent: !!token,
  })

  if (!token || !oldPassword || !newPassword) {
    console.warn('⚠️ Fehlende Eingaben')
    return res.status(400).json({ error: 'Altes und neues Passwort erforderlich' })
  }

  if (!validatePassword(newPassword)) {
    console.warn('⚠️ Passwortanforderungen nicht erfüllt:', newPassword)
    return res.status(400).json({
      error: 'Das neue Passwort muss mindestens 8 Zeichen lang sein und mindestens 1 Großbuchstaben enthalten.',
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const userId = decoded.userId
    console.log('🔑 Token verifiziert:', { userId })

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()

    console.log('📧 Nutzer-Daten:', { userData, userError })

    if (userError || !userData?.email) {
      console.warn('❌ Nutzer nicht gefunden:', userError?.message)
      return res.status(404).json({ error: 'Nutzer nicht gefunden' })
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: oldPassword,
    })

    if (loginError) {
      console.warn('❌ Falsches aktuelles Passwort:', loginError.message)
      return res.status(401).json({ error: 'Falsches aktuelles Passwort' })
    }

    console.log('🔁 Passwort wird geändert für:', userId)

    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (updateError) {
      console.error('❌ Fehler beim Passwort-Update:', updateError.message)
      return res.status(500).json({ error: 'Fehler beim Setzen des neuen Passworts' })
    }

    console.log('✅ Passwort erfolgreich geändert für:', userId)
    return res.status(200).json({ message: 'Passwort wurde erfolgreich geändert' })
  } catch (err) {
    console.error('❌ Fehler im Passwortwechsel:', err.message)
    return res.status(401).json({ error: 'Token ungültig oder abgelaufen' })
  }
})

export default router
