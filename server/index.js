// server/index.js
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import swaggerUi from 'swagger-ui-express'
import swaggerJSDoc from 'swagger-jsdoc'

import authRoutes from './routes/auth.js'
import decisionRoutes from './routes/decisions.js'
import userRoutes from './routes/users.js'
import aiRoutes from './routes/ai.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// ✅ CORS-Konfiguration – lokal + Vercel-URLs erlaubt
const allowedOrigins = [
  'http://localhost:5173',
  'https://decisiofrontend.vercel.app',
  'https://decisiofrontend-git-main-martenzoes-projects.vercel.app',
  'https://decisiofrontend-5jdba6sfe-martenzoes-projects.vercel.app',
  'https://decisio.vercel.app',
  'https://decisio-two.vercel.app',
  'https://decisio-git-main-martenzoes-projects.vercel.app' // <— DEIN JETZIGES PROBLEM
]

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      console.log('⛔ Blocked by CORS:', origin)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // ← damit OPTIONS erlaubt ist
  allowedHeaders: ['Content-Type', 'Authorization'], // ← notwendig für Preflight
}

app.use(cors(corsOptions))

// ⛔️ Wichtig: Diese Zeile MUSS kommen, damit OPTIONS-Anfragen korrekt beantwortet werden!
app.options('*', cors(corsOptions))

// 🔧 Middleware
app.use(express.json())

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
    security: [
      {
        bearerAuth: []
      }
    ]
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

// ✅ Test-Route
app.get('/', (req, res) => {
  res.send('🚀 API is running...')
})

// ✅ Server starten
app.listen(PORT, () => {
  console.log(`✅ Server läuft auf http://localhost:${PORT}`)
  console.log(`📚 Swagger Docs: http://localhost:${PORT}/api-docs`)
})
