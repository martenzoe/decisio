import { supabase } from '../supabaseClient'

export async function updateDecision(id, updates) {
  const { data, error } = await supabase
    .from('decisions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('❌ Fehler beim Aktualisieren der Entscheidung:', error)
    throw new Error(error.message)
  }

  return data
}
