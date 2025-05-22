import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

function Home() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const handleStart = () => {
    if (user) {
      navigate('/new-decision')
    } else {
      navigate('/login')
    }
  }

  const handleRegister = () => {
    if (user) {
      navigate('/dashboard')
    } else {
      navigate('/register')
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold text-white dark:text-white">
          Make smarter decisions – with structure & AI.
        </h1>
        <p className="text-white dark:text-gray-300 max-w-2xl mx-auto">
          Decisia helps you make better choices by combining your personal priorities with AI-assisted analysis.
          Whether you're choosing a job, comparing purchases, or solving complex questions – Decisia brings clarity to your decision-making process.
        </p>
        <div className="mt-6">
          <button
            onClick={handleStart}
            className="inline-block bg-[#4F46E5] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#4338CA] transition"
          >
            ➕ Create your first decision
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">📋 Structured Thinking</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Define your own options and criteria, assign weights, and compare them side by side.
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">🤖 AI-Powered Insights</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Let GPT evaluate your choices based on your priorities – including clear, transparent explanations.
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">📊 Weighted Scoring</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Scores are calculated automatically – fully transparent and exportable as PDF or CSV.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Ready to decide smarter?
        </h2>
        <button
          onClick={handleRegister}
          className="inline-block bg-[#4F46E5] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#4338CA] transition"
        >
          🚀 Start now – it's free
        </button>
      </section>
    </div>
  )
}

export default Home
