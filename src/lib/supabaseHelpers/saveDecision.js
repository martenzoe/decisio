import { supabase } from '../supabaseClient'

export async function saveDecision(decisionName, userId) {
  const { data, error } = await supabase
    .from('decisions')
    .insert([{ name: decisionName, user_id: userId }])
    .select()
    .single()

  if (error) throw new Error('❌ Fehler beim Speichern der Entscheidung: ' + error.message)

  return data // enthält z. B. decision_id
}
