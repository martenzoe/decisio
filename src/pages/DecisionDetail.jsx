import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function DecisionDetail() {
  const { id } = useParams()
  const [decision, setDecision] = useState(null)
  const [options, setOptions] = useState([])
  const [criteria, setCriteria] = useState([])
  const [evaluations, setEvaluations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: decisionData, error: decisionError } = await supabase
        .from('decisions')
        .select('*')
        .eq('id', id)
        .single()

      const { data: optionsData } = await supabase
        .from('options')
        .select('*')
        .eq('decision_id', id)

      const { data: criteriaData } = await supabase
        .from('criteria')
        .select('*')
        .eq('decision_id', id)

      const { data: evaluationsData } = await supabase
        .from('evaluations')
        .select('*')
        .in('option_id', optionsData.map((o) => o.id))

      if (decisionError) {
        console.error('Fehler beim Laden:', decisionError)
      } else {
        setDecision(decisionData)
        setOptions(optionsData || [])
        setCriteria(criteriaData || [])
        setEvaluations(evaluationsData || [])
      }

      setLoading(false)
    }

    fetchData()
  }, [id])

  const getScore = (optionId, criterionId) => {
    const found = evaluations.find(
      (e) => e.option_id === optionId && e.criterion_id === criterionId
    )
    return found ? found.score : '-'
  }

  const calculateTotalScore = (optionId) => {
    let total = 0
    let totalWeight = 0

    criteria.forEach((crit) => {
      const score = getScore(optionId, crit.id)
      if (score !== '-' && !isNaN(score)) {
        total += score * crit.weight
        totalWeight += crit.weight
      }
    })

    return totalWeight > 0 ? (total / totalWeight).toFixed(2) : '-'
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text(`Entscheidung: ${decision.name}`, 14, 20)

    const tableHead = [
      ['Option', ...criteria.map((c) => c.name), 'Gesamtscore']
    ]

    const tableBody = options.map((opt) => {
      const row = [opt.name]
      criteria.forEach((crit) => {
        row.push(getScore(opt.id, crit.id))
      })
      row.push(calculateTotalScore(opt.id))
      return row
    })

    autoTable(doc, {
      head: tableHead,
      body: tableBody,
      startY: 30,
    })

    doc.save(`Entscheidung_${decision.name}.pdf`)
  }

  const exportToCSV = () => {
    const headers = ['Option', ...criteria.map(c => c.name), 'Gesamtscore']
    const rows = options.map(opt => {
      const row = [opt.name]
      criteria.forEach(crit => {
        row.push(getScore(opt.id, crit.id))
      })
      row.push(calculateTotalScore(opt.id))
      return row
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Entscheidung_${decision.name}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) return <p className="p-4">⏳ Lädt Entscheidung...</p>
  if (!decision) return <p className="p-4">❌ Entscheidung nicht gefunden.</p>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">🔍 Entscheidung: {decision.name}</h2>
        <div className="space-x-4 text-sm">
          <Link to={`/decision/${id}/edit`} className="text-blue-600 underline">
            ✏️ Bearbeiten
          </Link>
          <Link to={`/decision/${id}/evaluate`} className="text-green-600 underline">
            🧮 Bewertung starten
          </Link>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Erstellt am: {new Date(decision.created_at).toLocaleString()}
      </p>

      <div>
        <h3 className="font-semibold mb-1">✅ Optionen</h3>
        <ul className="list-disc pl-6">
          {options.map((opt) => (
            <li key={opt.id}>{opt.name}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-semibold mb-1">📊 Kriterien (mit Gewichtung)</h3>
        <ul className="list-disc pl-6">
          {criteria.map((crit) => (
            <li key={crit.id}>
              {crit.name} ({crit.weight}%)
            </li>
          ))}
        </ul>
      </div>

      {evaluations.length > 0 && (
        <div>
          <h3 className="font-semibold mt-6 mb-2">🧮 Bewertungsmatrix</h3>

          <table className="w-full border text-sm">
            <thead>
              <tr>
                <th className="border px-3 py-2 text-left bg-gray-100">Option</th>
                {criteria.map((crit) => (
                  <th key={crit.id} className="border px-3 py-2 text-left bg-gray-100">
                    {crit.name}
                  </th>
                ))}
                <th className="border px-3 py-2 text-left bg-gray-100">⏱️ Gesamtscore</th>
              </tr>
            </thead>
            <tbody>
              {options.map((opt) => (
                <tr key={opt.id}>
                  <td className="border px-3 py-2 font-medium bg-gray-50">{opt.name}</td>
                  {criteria.map((crit) => (
                    <td key={crit.id} className="border px-3 py-2">
                      {getScore(opt.id, crit.id)}
                    </td>
                  ))}
                  <td className="border px-3 py-2 font-bold bg-blue-50">
                    {calculateTotalScore(opt.id)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex gap-4 mt-4">
            <button
              onClick={exportToPDF}
              className="bg-red-600 text-white px-4 py-2 rounded"
            >
              📄 Als PDF exportieren
            </button>
            <button
              onClick={exportToCSV}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              📊 Als CSV exportieren
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DecisionDetail
