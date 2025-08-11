import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { updateDecision } from '../api/decision';
import { useAuthStore } from '../store/useAuthStore';
import { useTranslation } from 'react-i18next';

function EditDecision() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore.getState().token;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState('');
  const [type, setType] = useState('');
  const [options, setOptions] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [evaluations, setEvaluations] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDecision = async () => {
      const res = await fetch(`https://decisio.onrender.com/api/decision/${id}/details`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        alert(t('editDecision.loadFailed'));
        return;
      }

      setName(data.decision.name);
      setDescription(data.decision.description);
      setMode(data.decision.mode);
      setType(data.decision.type);
      setOptions(data.options);
      setCriteria(data.criteria);

      const grouped = {};
      data.evaluations.forEach(e => {
        if (!grouped[e.option_id]) grouped[e.option_id] = {};
        grouped[e.option_id][e.criterion_id] = {
          value: e.value,
          explanation: e.explanation || ''
        };
      });
      setEvaluations(grouped);
      setLoading(false);
    };

    fetchDecision();
  }, [id, token, t]);

  const handleEvaluationChange = (option_id, criterion_id, field, value) => {
    setEvaluations(prev => ({
      ...prev,
      [option_id]: {
        ...prev[option_id],
        [criterion_id]: {
          ...prev[option_id]?.[criterion_id],
          [field]: value
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedEvaluations = [];
      for (const option of options) {
        for (const criterion of criteria) {
          const evalObj = evaluations[option.id]?.[criterion.id];
          if (evalObj && evalObj.value) {
            formattedEvaluations.push({
              option_index: options.findIndex(o => o.id === option.id),
              criterion_index: criteria.findIndex(c => c.id === criterion.id),
              value: Number(evalObj.value),
              explanation: evalObj.explanation
            });
          }
        }
      }

      const updatedOptions = options.map(o => ({ id: o.id, name: o.name }));
      const updatedCriteria = criteria.map(c => ({
        id: c.id,
        name: c.name,
        importance: Number(c.importance)
      }));

      await updateDecision(id, token, {
        name,
        description,
        mode,
        type,
        options: updatedOptions,
        criteria: updatedCriteria,
        evaluations: formattedEvaluations
      });

      alert(t('editDecision.updateSuccess'));
      navigate(`/decision/${id}`);
    } catch (err) {
      console.error(err);
      alert(t('editDecision.saveFailed'));
    }
  };

  if (loading) return <div className="p-8">⏳ {t('editDecision.loading')}</div>;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-4">✏️ {t('editDecision.title')}</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder={t('editDecision.titlePlaceholder')}
        />
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full p-2 border rounded"
          rows="3"
          placeholder={t('editDecision.descriptionPlaceholder')}
        />

        <div className="grid grid-cols-2 gap-4">
          <select value={mode} onChange={e => setMode(e.target.value)} className="p-2 border rounded">
            <option value="manual">{t('editDecision.modeManual')}</option>
            <option value="ai">{t('editDecision.modeAI')}</option>
          </select>
          <select value={type} onChange={e => setType(e.target.value)} className="p-2 border rounded">
            <option value="private">{t('editDecision.typePrivate')}</option>
            <option value="public">{t('editDecision.typePublic')}</option>
          </select>
        </div>

        <div>
          <h3 className="font-semibold">⚙️ {t('editDecision.optionsHeading')}</h3>
          {options.map((opt, i) => (
            <input
              key={opt.id}
              type="text"
              value={opt.name}
              onChange={e => {
                const updated = [...options];
                updated[i].name = e.target.value;
                setOptions(updated);
              }}
              className="w-full mb-2 p-2 border rounded"
            />
          ))}
        </div>

        <div>
          <h3 className="font-semibold">📊 {t('editDecision.criteriaHeading')}</h3>
          {criteria.map((crit, i) => (
            <div key={crit.id} className="flex gap-2 mb-2">
              <input
                type="text"
                value={crit.name}
                onChange={e => {
                  const updated = [...criteria];
                  updated[i].name = e.target.value;
                  setCriteria(updated);
                }}
                className="flex-1 p-2 border rounded"
              />
              <input
                type="number"
                value={crit.importance}
                onChange={e => {
                  const updated = [...criteria];
                  updated[i].importance = e.target.value;
                  setCriteria(updated);
                }}
                className="w-20 p-2 border rounded"
              />
            </div>
          ))}
        </div>

        <div>
          <h3 className="font-semibold mb-2">🔢 {t('editDecision.evaluationsHeading')}</h3>
          <table className="min-w-full border">
            <thead>
              <tr>
                <th className="border p-2 text-left">{t('editDecision.optionColumn')}</th>
                {criteria.map(c => (
                  <th key={c.id} className="border p-2 text-left">{c.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {options.map(opt => (
                <tr key={opt.id}>
                  <td className="border p-2 font-medium">{opt.name}</td>
                  {criteria.map(crit => (
                    <td key={crit.id} className="border p-2">
                      <input
                        type="number"
                        value={evaluations[opt.id]?.[crit.id]?.value || ''}
                        onChange={e => handleEvaluationChange(opt.id, crit.id, 'value', e.target.value)}
                        className="w-16 p-1 border rounded"
                        min="1"
                        max="10"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          💾 {t('editDecision.saveButton')}
        </button>
      </form>
    </div>
  );
}

export default EditDecision;
