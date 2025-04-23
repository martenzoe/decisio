import { supabase } from '../supabaseClient'

export async function saveCriteria(criteria, decisionId) {
  const payload = criteria.map((crit) => ({
    name: crit.name,
    weight: Number(crit.weight),
    decision_id: decisionId
  }))

  const { data, error } = await supabase
    .from('criteria')
    .insert(payload)
    .select()

  if (error) throw new Error('❌ Fehler beim Speichern der Kriterien: ' + error.message)

  return data
}
