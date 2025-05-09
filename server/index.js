// server/index.js
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import decisionRoutes from './routes/decisions.js'
import userRoutes from './routes/users.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// Routen
app.use('/api', authRoutes)
app.use('/api/decision', decisionRoutes)
app.use('/api/users', userRoutes)

app.get('/', (req, res) => {
  res.send('🚀 API is running...')
})

app.listen(PORT, () => {
  console.log(`✅ Server läuft auf http://localhost:${PORT}`)
})
