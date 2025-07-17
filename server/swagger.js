// server/swagger.js
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Decisia API',
      version: '1.0.0',
      description: 'Dokumentation der REST API von Decisia',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      }
    },
    security: [{
      bearerAuth: []
    }],
    servers: [
      {
        url: 'https://decisio.onrender.com',
      },
    ],
  },
  apis: ['./routes/*.js'], // durchsucht alle Routen-Dateien für Swagger-Kommentare
}

const swaggerSpec = swaggerJsdoc(options)

function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
}

export default setupSwagger
