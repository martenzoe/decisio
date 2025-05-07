import { supabase } from '../supabaseClient'

export async function deleteDecision(id) {
  const { error } = await supabase
    .from('decisions')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('❌ Fehler beim Löschen der Entscheidung:', error)
    throw new Error(error.message)
  }

  return true
}

// 