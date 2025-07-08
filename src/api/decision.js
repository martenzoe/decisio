// src/api/decision.js

export async function updateDecision(decisionId, token, data) {
  const { name, description, mode, type, options, criteria, evaluations } = data;

  // Optionen speichern
  const optionRes = await fetch(`http://localhost:3000/api/decision/${decisionId}/options`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ options }),
  });
  if (!optionRes.ok) throw new Error('Fehler beim Speichern der Optionen');

  const insertedOptions = await optionRes.json();
  const optionMap = insertedOptions.reduce((acc, opt, idx) => {
    acc[idx] = opt.id;
    return acc;
  }, {});

  // Kriterien speichern
  const criteriaRes = await fetch(`http://localhost:3000/api/decision/${decisionId}/criteria`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ criteria }),
  });
  if (!criteriaRes.ok) throw new Error('Fehler beim Speichern der Kriterien');

  const insertedCriteria = await criteriaRes.json();
  const criteriaMap = insertedCriteria.reduce((acc, crit, idx) => {
    acc[idx] = crit.id;
    return acc;
  }, {});

  // Bewertungen mit neuen IDs verknüpfen
  const formattedEvaluations = evaluations.map((e) => ({
    option_id: optionMap[e.option_index],
    criterion_id: criteriaMap[e.criterion_index],
    value: e.value,
    explanation: e.explanation,
  }));

  // Bewertungen speichern
  const evalRes = await fetch(`http://localhost:3000/api/decision/${decisionId}/evaluations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ evaluations: formattedEvaluations }),
  });
  if (!evalRes.ok) throw new Error('Fehler beim Speichern der Bewertungen');

  // Basisdaten aktualisieren
  const patchRes = await fetch(`http://localhost:3000/api/decision/${decisionId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, description, mode, type }),
  });
  if (!patchRes.ok) throw new Error('Fehler beim Aktualisieren der Entscheidung');
}
