// src/api/teamDecision.js

export async function createTeamDecision(payload, token) {
  const res = await fetch('http://localhost:3000/api/team-decisions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...payload,
      type: 'team', // ✅ Wichtig für Supabase-Check-Constraint
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Fehler beim Erstellen');
  return data.decision;
}

export async function updateTeamDecision(decisionId, token, payload) {
  const res = await fetch(`http://localhost:3000/api/decision/${decisionId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Fehler beim Aktualisieren');
  return data;
}
