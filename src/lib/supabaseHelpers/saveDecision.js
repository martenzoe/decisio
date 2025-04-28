import { supabase } from '../supabaseClient'

export async function saveDecision({ name, description, mode, userId }) {
  const { data, error } = await supabase
    .from('decisions')
    .insert([
      {
        name,
        description,
        mode,
        user_id: userId,
      },
    ])
    .select()
    .single()

  if (error) {
    console.error('❌ Fehler beim Speichern der Entscheidung:', error)
    throw new Error(error.message)
  }

  return data // z.B. { id, name, ... }
}
