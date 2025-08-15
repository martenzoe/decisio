// server/supabaseClient.js
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// .env laden (Root + server/.env als Fallback)
dotenv.config()
const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '.env') })
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const SUPABASE_URL = (
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL
)

const SERVICE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SECRET
)

// Optional – nur falls du irgendwo explizit einen Anon-Client brauchst
const ANON_KEY = (
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY
)

if (!SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL in environment.')
}

// 👉 Server-seitig lieber **erzwingen**, dass die Service-Role gesetzt ist.
// (Sonst riskierst du RLS-Fehler an Stellen, die Admin-Rechte erwarten.)
if (!SERVICE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY in environment (required on server).')
}

// Admin-Client (bypasst RLS – nur serverseitig verwenden!)
export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
})

// Optionaler Anon-Client – **nicht** mit in den Browser bundlen!
export const supabaseAnon = ANON_KEY
  ? createClient(SUPABASE_URL, ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    })
  : null

export default supabaseAdmin
