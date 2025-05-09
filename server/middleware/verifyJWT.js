// server/middleware/verifyJWT.js
import jwt from 'jsonwebtoken'

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Format: Bearer <token>

  if (!token) {
    return res.status(401).json({ error: '🔐 Kein Token übermittelt' })
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: '🚫 Ungültiger Token' })
    }

    req.userId = decoded.userId // Achtung: Muss mit dem Payload beim Login übereinstimmen
    next()
  })
}

export default verifyJWT
