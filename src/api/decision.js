// src/api/decision.js

export async function updateDecision(id, token, updates) {
  // Alles in einem Rutsch an das Backend schicken – so wie dein Backend es erwartet
  const res = await fetch(`/api/decision/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: updates.name,
      description: updates.description,
      mode: updates.mode,
      type: updates.type,
      options: updates.options,         // [{ name }]
      criteria: updates.criteria,       // [{ name, importance }]
      evaluations: updates.evaluations  // [{ option_id, criterion_id, value, explanation }]
    }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Fehler beim Aktualisieren der Entscheidung')

  return data
}
