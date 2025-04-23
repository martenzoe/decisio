import { useState } from 'react'

function Evaluation() {
  const [scores, setScores] = useState({})
  const [result, setResult] = useState(null)

  // Dummy-Daten (aus vorherigem Schritt)
  const options = ['Option A', 'Option B']
  const criteria = [
    { name: 'Gehalt', weight: 50 },
    { name: 'Work-Life-Balance', weight: 30 },
    { name: 'Entwicklungschancen', weight: 20 }
  ]

  const handleChange = (option, criterion, value) => {
    setScores((prev) => ({
      ...prev,
      [option]: {
        ...prev[option],
        [criterion]: Number(value)
      }
    }))
  }

  const calculate = () => {
    const results = options.map((option) => {
      const total = criteria.reduce((acc, criterion) => {
        const score = scores[option]?.[criterion.name] || 0
        return acc + (score * (criterion.weight / 100))
      }, 0)

      return { option, score: total.toFixed(2) }
    })

    setResult(results.sort((a, b) => b.score - a.score))
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold">📊 Bewertung</h2>

      <table className="w-full border text-left">
        <thead>
          <tr>
            <th className="border px-3 py-2">Kriterium</th>
            {options.map((option) => (
              <th key={option} className="border px-3 py-2">{option}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {criteria.map((criterion) => (
            <tr key={criterion.name}>
              <td className="border px-3 py-2 font-semibold">
                {criterion.name} ({criterion.weight}%)
              </td>
              {options.map((option) => (
                <td key={option} className="border px-3 py-2">
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={scores[option]?.[criterion.name] || ''}
                    onChange={(e) => handleChange(option, criterion.name, e.target.value)}
                    className="w-full border px-2 py-1 rounded"
                    required
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={calculate}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        ➕ Score berechnen
      </button>

      {result && (
        <div className="mt-6 space-y-2">
          <h3 className="text-xl font-bold">🏆 Ergebnis</h3>
          <ul className="list-disc pl-6">
            {result.map((res, index) => (
              <li key={res.option}>
                {index === 0 && '⭐️'} {res.option}: <strong>{res.score}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default Evaluation
