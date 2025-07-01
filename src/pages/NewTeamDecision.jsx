import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGPTRecommendation } from '../ai/decisionAdvisor';
import { updateDecision } from '../api/decision';

function NewTeamDecision() {
  const [decisionName, setDecisionName] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState('manual');
  const [type, setType] = useState('public');
  const [options, setOptions] = useState(['']);
  const [criteria, setCriteria] = useState([{ name: '', importance: '' }]);
  const [evaluations, setEvaluations] = useState({});
  const [gptFinished, setGptFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const updateEvaluations = (opts, crits) => {
    const newEval = {};
    opts.forEach((_, optIdx) => {
      newEval[optIdx] = {};
      crits.forEach((_, critIdx) => {
        newEval[optIdx][critIdx] = '';
        newEval[optIdx][`explanation_${critIdx}`] = '';
      });
    });
    setEvaluations(newEval);
  };

  const handleAddOption = () => {
    const newOptions = [...options, ''];
    setOptions(newOptions);
    updateEvaluations(newOptions, criteria);
  };

  const handleRemoveOption = (index) => {
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    updateEvaluations(newOptions, criteria);
  };

  const handleAddCriterion = () => {
    const newCriteria = [...criteria, { name: '', importance: '' }];
    setCriteria(newCriteria);
    updateEvaluations(options, newCriteria);
  };

  const handleRemoveCriterion = (index) => {
    const newCriteria = criteria.filter((_, i) => i !== index);
    setCriteria(newCriteria);
    updateEvaluations(options, newCriteria);
  };

  const handleEvaluationChange = (optIdx, critIdx, value) => {
    setEvaluations(prev => ({
      ...prev,
      [optIdx]: {
        ...prev[optIdx],
        [critIdx]: value
      }
    }));
  };

  const handleGPTRecommendation = async () => {
    if (!decisionName || !description || options.some(o => !o) || criteria.some(c => !c.name || !c.importance)) {
      return alert('⚠️ Please fill in all fields.');
    }

    setLoading(true);
    try {
      const gptResult = await getGPTRecommendation({ decisionName, description, options, criteria });
      const newEvaluations = {};
      gptResult.forEach((optionResult, optIdx) => {
        const row = {};
        criteria.forEach((crit, critIdx) => {
          const match = optionResult.bewertungen.find(b => b.kriterium === crit.name);
          row[critIdx] = match ? Math.round(match.score) : 0;
          row[`explanation_${critIdx}`] = match?.begründung || '';
        });
        newEvaluations[optIdx] = row;
      });
      setEvaluations(newEvaluations);
      setGptFinished(true);
      alert('✅ GPT recommendations applied.');
    } catch (err) {
      console.error('❌ GPT error:', err.message);
      alert('❌ GPT evaluation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return alert('⛔ Token not found');
    if (!decisionName || options.some(o => !o) || criteria.some(c => !c.name || !c.importance)) {
      return alert('⚠️ Please fill in all fields.');
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/team/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: decisionName, description, mode, type })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler beim Erstellen der Entscheidung');

      const decisionId = data.decision.id;

      const formattedOptions = options.map(o => ({ name: o }));
      const formattedCriteria = criteria.map(c => ({
        name: c.name,
        importance: Number(c.importance),
      }));

      const evaluationsArray = [];
      options.forEach((_, optIdx) => {
        criteria.forEach((_, critIdx) => {
          const value = Number(evaluations[optIdx]?.[critIdx]);
          const explanation = evaluations[optIdx]?.[`explanation_${critIdx}`] || null;
          if (!isNaN(value)) {
            evaluationsArray.push({
              option_index: optIdx,
              criterion_index: critIdx,
              value,
              explanation,
            });
          }
        });
      });

      await updateDecision(decisionId, token, {
        name: decisionName,
        description,
        mode,
        type,
        options: formattedOptions,
        criteria: formattedCriteria,
        evaluations: evaluationsArray,
      });

      navigate(`/team-invite/${decisionId}`);
    } catch (err) {
      console.error('❌ Save error:', err.message);
      alert(`❌ Fehler: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      {loading && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
            <p className="animate-pulse text-gray-900 dark:text-white text-sm">
              ⏳ Verarbeite Eingaben ...
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">👥 Neue Team-Entscheidung</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="text" placeholder="Titel" value={decisionName} onChange={e => setDecisionName(e.target.value)} className="w-full border px-4 py-2 rounded" required />
          <textarea placeholder="Beschreibung..." value={description} onChange={e => setDescription(e.target.value)} className="w-full border px-4 py-2 rounded" rows="3" />

          <div className="grid grid-cols-2 gap-4">
            <select value={mode} onChange={e => setMode(e.target.value)} className="border px-4 py-2 rounded">
              <option value="manual">Manuell</option>
              <option value="ai">KI-gestützt</option>
            </select>
            <select value={type} onChange={e => setType(e.target.value)} className="border px-4 py-2 rounded">
              <option value="public">Öffentlich</option>
              <option value="private">Privat</option>
            </select>
          </div>

          {/* Optionen */}
          <div>
            <label className="font-semibold">Optionen</label>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input type="text" value={opt} onChange={(e) => {
                  const newOptions = [...options];
                  newOptions[i] = e.target.value;
                  setOptions(newOptions);
                  updateEvaluations(newOptions, criteria);
                }} className="w-full border px-4 py-2 rounded" required />
                <button type="button" onClick={() => handleRemoveOption(i)} className="text-red-500 hover:underline">✖</button>
              </div>
            ))}
            <button type="button" onClick={handleAddOption} className="text-blue-600 hover:underline text-sm">➕ Weitere Option</button>
          </div>

          {/* Kriterien */}
          <div>
            <label className="font-semibold">Kriterien (Wichtigkeit in %)</label>
            {criteria.map((crit, i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <input type="text" value={crit.name} onChange={e => {
                  const newCrit = [...criteria];
                  newCrit[i].name = e.target.value;
                  setCriteria(newCrit);
                  updateEvaluations(options, newCrit);
                }} className="flex-1 border px-3 py-2 rounded" required />
                <input type="number" value={crit.importance} onChange={e => {
                  const newCrit = [...criteria];
                  newCrit[i].importance = e.target.value;
                  setCriteria(newCrit);
                }} className="w-20 border px-3 py-2 rounded" required />
                <button type="button" onClick={() => handleRemoveCriterion(i)} className="text-red-500 hover:underline">✖</button>
              </div>
            ))}
            <button type="button" onClick={handleAddCriterion} className="text-blue-600 hover:underline text-sm">➕ Weiteres Kriterium</button>
          </div>

          {mode === 'ai' && !gptFinished && (
            <button type="button" onClick={handleGPTRecommendation} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition">
              🤖 GPT-Auswertung starten
            </button>
          )}

          {(mode === 'manual' || gptFinished) && (
            <>
              <label className="font-semibold">Bewertungen (1–10)</label>
              <div className="overflow-auto">
                <table className="min-w-full border text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-2 py-1 text-left">Option</th>
                      {criteria.map((c, ci) => (
                        <th key={ci} className="border px-2 py-1 text-left">{c.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {options.map((opt, oi) => (
                      <tr key={oi}>
                        <td className="border px-2 py-1 font-medium">{opt}</td>
                        {criteria.map((_, ci) => (
                          <td key={ci} className="border px-2 py-1">
                            <input type="number" min="1" max="10" value={evaluations[oi]?.[ci] || ''} onChange={(e) => handleEvaluationChange(oi, ci, e.target.value)} className="w-16 px-2 py-1 border rounded" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
            ✅ Team-Entscheidung erstellen & Einladen
          </button>
        </form>
      </div>
    </div>
  );
}

export default NewTeamDecision;
