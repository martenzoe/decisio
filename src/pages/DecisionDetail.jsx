import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import logo from '../assets/decisia-logo.png'

function DecisionDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const fetchData = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/decision/${id}/details`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to load decision')
        setData(json)
      } catch (err) {
        setError(err.message)
      }
    }

    fetchData()
  }, [id])

  if (error) return <div className="text-red-600 text-center mt-10">{error}</div>
  if (!data) return <div className="text-gray-600 text-center mt-10">⏳ Loading...</div>

  const { decision, options, criteria, evaluations } = data

  const getScore = (optionId) => {
    const evals = evaluations.filter(e => e.option_id === optionId)
    const weighted = evals.map(e => {
      const crit = criteria.find(c => c.id === e.criterion_id)
      return crit ? (e.value * crit.importance) / 100 : 0
    })
    if (!weighted.length) return 0
    const score = weighted.reduce((a, b) => a + b, 0)
    return Math.round(score * 10) / 10
  }

  const downloadCSV = () => {
    let csv = 'Option'
    criteria.forEach(c => csv += `,${c.name} (${c.importance}%)`)
    csv += ',Score\n'

    options.forEach(opt => {
      let row = `${opt.name}`
      criteria.forEach(crit => {
        const evalValue = evaluations.find(e => e.option_id === opt.id && e.criterion_id === crit.id)
        row += `,${evalValue?.value || '-'}`
      })
      row += `,${getScore(opt.id)}\n`
      csv += row
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${decision.name}.csv`
    link.click()
  }

  const downloadPDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    const img = new Image()
    img.src = logo
    img.onload = () => {
      // CI-Farbbalken
      doc.setFillColor(79, 70, 229) // #4F46E5
      doc.rect(0, 0, pageWidth, 25, 'F')

      doc.addImage(img, 'PNG', 10, 6, 20, 12)

      doc.setFontSize(14)
      doc.setTextColor(255, 255, 255)
      doc.text(decision.name, 35, 12)

      doc.setFontSize(10)
      doc.setTextColor(255, 255, 255)
      doc.text(doc.splitTextToSize(decision.description || '', pageWidth - 20), 10, 22)

      const tableBody = []

      options.forEach(opt => {
        const row = [opt.name]
        criteria.forEach(c => {
          const match = evaluations.find(e => e.option_id === opt.id && e.criterion_id === c.id)
          row.push(match?.value ?? '-')
        })
        row.push(getScore(opt.id))
        tableBody.push(row)

        const explanations = criteria
          .map(c => {
            const match = evaluations.find(e => e.option_id === opt.id && e.criterion_id === c.id)
            return match?.explanation ? `${c.name}: ${match.explanation}` : null
          })
          .filter(Boolean)
          .join('\n')

        if (explanations) {
          tableBody.push([
            {
              content: `🧠 ${explanations}`,
              colSpan: criteria.length + 2,
              styles: { fontStyle: 'italic', textColor: '#555' }
            }
          ])
        }
      })

      const head = [['Option', ...criteria.map(c => `${c.name} (${c.importance}%)`), 'Score']]

      autoTable(doc, {
        startY: 30,
        head,
        body: tableBody,
        styles: {
          halign: 'left',
          valign: 'middle',
        },
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        columnStyles: {
          [head[0].length - 1]: { fontStyle: 'bold', textColor: '#2563eb' },
        },
        margin: { top: 30, bottom: 10, left: 10, right: 10 }
      })

      doc.save(`${decision.name}.pdf`)
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-8">
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {decision.name}
        </h2>
        <p className="text-gray-700 dark:text-gray-300">{decision.description}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-6 overflow-x-auto">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          🔎 Evaluation Details
        </h3>

        <table className="min-w-full text-sm border border-gray-300 dark:border-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100">
            <tr>
              <th className="border p-2 text-left">Option</th>
              {criteria.map(c => (
                <th key={c.id} className="border p-2 text-left">
                  {c.name} ({c.importance}%)
                </th>
              ))}
              <th className="border p-2 text-left">Score</th>
            </tr>
          </thead>
          <tbody>
            {options.map(opt => (
              <tr key={opt.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="border p-2 font-semibold text-gray-900 dark:text-white">{opt.name}</td>
                {criteria.map(crit => {
                  const match = evaluations.find(e => e.option_id === opt.id && e.criterion_id === crit.id)
                  return (
                    <td key={crit.id} className="border p-2 text-gray-700 dark:text-gray-300">
                      <div>
                        <strong>{match?.value ?? '-'}</strong>
                        {match?.explanation && (
                          <div className="text-xs mt-1 italic text-gray-500 dark:text-gray-400">
                            {match.explanation}
                          </div>
                        )}
                      </div>
                    </td>
                  )
                })}
                <td className="border p-2 font-bold text-blue-600 dark:text-blue-400">
                  {getScore(opt.id)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {decision.type === 'public' && (
          <div className="flex gap-4 mt-6">
            <button
              onClick={downloadCSV}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              ⬇️ Export as CSV
            </button>
            <button
              onClick={downloadPDF}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              🧾 Export as PDF
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default DecisionDetail
