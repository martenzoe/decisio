const API_URL = 'http://localhost:3000/api';

export const getDecisionById = async (id, token) => {
  const res = await fetch(`${API_URL}/decision/${id}/details`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Fehler beim Laden der Entscheidung');
  return data;
};

export const updateDecision = async (id, token, { name, description, mode, type, options, criteria, evaluations }) => {
  const baseHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Entscheidung aktualisieren
  const resMain = await fetch(`${API_URL}/decision/${id}`, {
    method: 'PUT',
    headers: baseHeaders,
    body: JSON.stringify({ name, description, mode, type }),
  });
  const dataMain = await resMain.json();
  if (!resMain.ok) throw new Error(dataMain.error || 'Fehler beim Aktualisieren');

  // Optionen speichern
  const resOpt = await fetch(`${API_URL}/decision/${id}/options`, {
    method: 'POST',
    headers: baseHeaders,
    body: JSON.stringify({ options }),
  });
  const dataOpt = await resOpt.json();
  if (!resOpt.ok) throw new Error(dataOpt.error || 'Fehler beim Speichern der Optionen');

  // Kriterien speichern
  const resCrit = await fetch(`${API_URL}/decision/${id}/criteria`, {
    method: 'POST',
    headers: baseHeaders,
    body: JSON.stringify({ criteria }),
  });
  const dataCrit = await resCrit.json();
  if (!resCrit.ok) throw new Error(dataCrit.error || 'Fehler beim Speichern der Kriterien');

  // Bewertungen speichern (Indexbasiert → IDs ermittelt das Backend)
  const resEval = await fetch(`${API_URL}/decision/${id}/evaluations`, {
    method: 'POST',
    headers: baseHeaders,
    body: JSON.stringify({ evaluations }),
  });
  const dataEval = await resEval.json();
  if (!resEval.ok) throw new Error(dataEval.error || 'Fehler beim Speichern der Bewertungen');
};
