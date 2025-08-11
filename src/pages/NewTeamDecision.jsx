import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useTranslation, Trans } from 'react-i18next'

// Helper functions for validation
function hasDuplicates(array) {
  return new Set(array).size !== array.length
}
function isEmptyOrWhitespace(str) {
  return !str || !str.trim()
}

function NewTeamDecision() {
  const [decisionName, setDecisionName] = useState('')
  const [description, setDescription] = useState('')
  const [mode, setMode] = useState('manual')
  const [timer, setTimer] = useState('')
  const [options, setOptions] = useState([''])
  const [criteria, setCriteria] = useState([''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const { t } = useTranslation()

  useEffect(() => {
    if (!token) navigate('/login')
  }, [token, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!decisionName) {
      setError(t('newTeamDecision.errorNoTitle'))
      return
    }

    setLoading(true)

    try {
      const basePayload = {
        name: decisionName,
        description,
        mode,
        timer,
        type: 'team',
        options: options.filter(o => !isEmptyOrWhitespace(typeof o === 'string' ? o : o?.name)).map(o =>
          typeof o === 'string' ? { name: o } : { name: o.name }
        ),
        criteria: criteria.filter(isEmptyOrWhitespace).length === criteria.length
          ? []
          : criteria.filter(c => !isEmptyOrWhitespace(c)).map(name => ({ name }))
      }

      const res = await fetch('/api/team-decisions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(basePayload)
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || t('newTeamDecision.unknownError'))
      const { decision } = result
      if (!decision?.id) throw new Error(t('newTeamDecision.noIdError'))
      const decisionId = decision.id

      navigate(`/team-invite/${decisionId}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOptionChange = (idx, value) => {
    const updated = [...options]
    updated[idx] = value
    setOptions(updated)
  }

  const handleCriterionChange = (idx, value) => {
    const updated = [...criteria]
    updated[idx] = value
    setCriteria(updated)
  }

  return (
    <div>
      <div className="max-w-4xl mx-auto p-8 space-y-10 shadow-2xl rounded-2xl bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-100">
        <h1 className="text-3xl font-bold">{t('newTeamDecision.title')}</h1>
        <div className="bg-blue-900/90 text-white rounded px-4 py-3 mb-6 text-sm">
          <Trans i18nKey="newTeamDecision.note" components={{ 1: <b />, 3: <b /> }} />
        </div>
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              value={decisionName}
              onChange={(e) => setDecisionName(e.target.value)}
              placeholder={t('newTeamDecision.titlePlaceholder')}
              className="p-3 border rounded-lg"
            />
            <input
              type="datetime-local"
              value={timer}
              onChange={(e) => setTimer(e.target.value)}
              className="p-3 border rounded-lg"
            />
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="p-3 border rounded-lg"
            >
              <option value="manual">{t('newTeamDecision.manual')}</option>
              <option value="ai">{t('newTeamDecision.aiMode')}</option>
            </select>
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('newTeamDecision.descriptionPlaceholder')}
            className="w-full p-3 border rounded-lg"
            rows={3}
          />

          {/* Options */}
          <div>
            <h2 className="text-lg font-semibold">
              {t('newTeamDecision.options')} <span className="text-gray-400 text-base">({t('newTeamDecision.optional')})</span>
            </h2>
            {options.map((opt, idx) => (
              <div key={idx} className="flex gap-2 mt-2">
                <input
                  value={typeof opt === 'string' ? opt : opt.name || ''}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={t('newTeamDecision.optionPlaceholder', { number: idx + 1 })}
                  className="flex-1 p-2 border rounded"
                />
                <button type="button" aria-label={t('newTeamDecision.deleteOption')} onClick={() => setOptions(options.filter((_, i) => i !== idx))}>X</button>
              </div>
            ))}
            <button type="button" onClick={() => setOptions([...options, ''])} className="mt-2 text-blue-600">
              + {t('newTeamDecision.addOption')}
            </button>
          </div>

          {/* Criteria */}
          <div>
            <h2 className="text-lg font-semibold">
              {t('newTeamDecision.criteria')} <span className="text-gray-400 text-base">({t('newTeamDecision.optional')})</span>
            </h2>
            {criteria.map((c, idx) => (
              <div key={idx} className="flex gap-2 mt-2">
                <input
                  value={c}
                  onChange={(e) => handleCriterionChange(idx, e.target.value)}
                  placeholder={t('newTeamDecision.criterionPlaceholder')}
                  className="flex-1 p-2 border rounded"
                />
                <button type="button" aria-label={t('newTeamDecision.deleteCriterion')} onClick={() => setCriteria(criteria.filter((_, i) => i !== idx))}>X</button>
              </div>
            ))}
            <button type="button" onClick={() => setCriteria([...criteria, ''])} className="mt-2 text-blue-600">
              + {t('newTeamDecision.addCriterion')}
            </button>
          </div>

          {error && (
            <div className="text-red-600 bg-red-50 border border-red-200 p-3 rounded">
              {error}
            </div>
          )}

          <div className="text-right">
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow font-semibold">
              {loading ? t('newTeamDecision.saving') : t('newTeamDecision.continue')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewTeamDecision
