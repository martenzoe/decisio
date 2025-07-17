import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import swaggerUi from 'swagger-ui-express'
import swaggerJSDoc from 'swagger-jsdoc'

import aiRoutes from './routes/ai.js'
import authRoutes from './routes/auth.js'
import changePasswordRoutes from './routes/changePassword.js'
import commentsRouter from './routes/comments.js'
import decisionRoutes from './routes/decisions.js'
import teamRoutes from './routes/team.js'
import teamDecisionRoutes from './routes/teamDecision.js'
import userRoutes from './routes/users.js'
import notificationsRoutes from './routes/notifications.js'
// import teamEvaluationsRoutes from './routes/teamEvaluations.js' // ENTFERNT

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://decisiofrontend.vercel.app',
  'https://decisio-d4p13mjs4-martenzoes-projects.vercel.app',
  'https://decisiofrontend-git-main-martenzoes-projects.vercel.app',
  'https://decisiofrontend-5jdba6sfe-martenzoes-projects.vercel.app',
  'https://decisio-two.vercel.app',
  'https://decisio.vercel.app',
  'https://decisio-o1r6cl1ri-martenzoes-projects.vercel.app'
]

app.use(cors({
  origin: (origin, callback) => {
    console.log('🔍 Origin:', origin)
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.includes('localhost')
    ) {
      callback(null, true)
    } else {
      console.warn(`⛔ Blocked by CORS: ${origin}`)
      callback(new Error('⛔ Not allowed by CORS'))
    }
  },
  credentials: true,
}))

app.use(express.json())

// 🔒 Cache-Control für ALLE API-Routen deaktivieren
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.set('Pragma', 'no-cache')
  res.set('Expires', '0')
  res.set('Surrogate-Control', 'no-store')
  next()
})

// ✅ Swagger Setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Decisia API',
      version: '1.0.0',
      description: 'REST API for decision support app (React + Express + Supabase + GPT)',
    },
    servers: [{ url: 'http://localhost:3000' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./routes/*.js'],
}

const swaggerSpec = swaggerJSDoc(swaggerOptions)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// ✅ API-Routen
app.use('/api', authRoutes)
app.use('/api/decision', decisionRoutes)
app.use('/api/users', userRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/change-password', changePasswordRoutes)
app.use('/api/comments', commentsRouter)
app.use('/api/team', teamRoutes)
app.use('/api/team-decisions', teamDecisionRoutes)
app.use('/api/notifications', notificationsRoutes) // ✅ NEU
// app.use('/api/team-evaluations', teamEvaluationsRoutes) // ENTFERNT

// ✅ Test-Route
app.get('/', (req, res) => {
  res.send('🚀 API is running...')
})

// ✅ Server starten
app.listen(PORT, () => {
  console.log(`✅ Server läuft auf http://localhost:${PORT}`)
  console.log(`📚 Swagger Docs: http://localhost:${PORT}/api-docs`)
})
