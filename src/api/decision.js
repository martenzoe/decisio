export async function updateDecision(id, token, updates) {
  // Erst die Hauptdaten aktualisieren
  const res = await fetch(`/api/decision/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Fehler beim Aktualisieren')

  // Optionale Updates – nur wenn vorhanden
  if (updates.options && updates.options.length > 0) {
    const resOptions = await fetch(`/api/decision/${id}/options`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ options: updates.options }),
    })
    if (!resOptions.ok) {
      const err = await resOptions.json()
      throw new Error(err.error || 'Fehler beim Aktualisieren der Optionen')
    }
  }

  if (updates.criteria && updates.criteria.length > 0) {
    const resCriteria = await fetch(`/api/decision/${id}/criteria`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ criteria: updates.criteria }),
    })
    if (!resCriteria.ok) {
      const err = await resCriteria.json()
      throw new Error(err.error || 'Fehler beim Aktualisieren der Kriterien')
    }
  }

  if (updates.evaluations && updates.evaluations.length > 0) {
    const resEvals = await fetch(`/api/decision/${id}/evaluations`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ evaluations: updates.evaluations }),
    })
    if (!resEvals.ok) {
      const err = await resEvals.json()
      throw new Error(err.error || 'Fehler beim Aktualisieren der Bewertungen')
    }
  }

  return data
}
