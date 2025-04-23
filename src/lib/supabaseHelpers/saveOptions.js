import { supabase } from '../supabaseClient'

export async function saveOptions(options, decisionId) {
  const payload = options.map((name) => ({
    name,
    decision_id: decisionId
  }))

  const { data, error } = await supabase
    .from('options')
    .insert(payload)
    .select()

  if (error) throw new Error('❌ Fehler beim Speichern der Optionen: ' + error.message)

  return data
}
