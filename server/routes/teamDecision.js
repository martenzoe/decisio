import express from 'express'
import { supabase } from '../db.js'
import verifyJWT from '../middleware/verifyJWT.js'

const router = express.Router()

// GET: Alle Team-Entscheidungen des eingeloggten Nutzers
router.get('/', verifyJWT, async (req, res) => {
  const user_id = req.userId

  try {
    // Hole alle Decision-IDs, an denen der Nutzer beteiligt ist (accepted = true)
    const { data: teamMemberships, error: teamError } = await supabase
      .from('team_members')
      .select('decision_id')
      .eq('user_id', user_id)
      .eq('accepted', true)

    if (teamError) throw teamError

    const decisionIds = teamMemberships.map(row => row.decision_id)

    // Lade alle Entscheidungen mit diesen IDs (plus Ersteller-Infos)
    const { data: decisions, error: decisionError } = await supabase
      .from('decisions')
      .select('*')
      .in('id', decisionIds)
      .order('created_at', { ascending: false })

    if (decisionError) throw decisionError

    res.json(decisions)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
