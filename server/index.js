import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import decisionsRoutes from './routes/decisions.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use('/api', authRoutes)
app.use('/api/decision', decisionsRoutes)

app.get('/', (req, res) => {
  res.send('🚀 API is running...')
})

app.listen(PORT, () => {
  console.log(`✅ Server läuft auf http://localhost:${PORT}`)
})
