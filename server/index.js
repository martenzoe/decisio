import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Testroute
app.get('/api/ping', (req, res) => {
  res.send('✅ API läuft')
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`))
