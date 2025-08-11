import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useTranslation } from 'react-i18next'

function Home() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { t } = useTranslation()

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
          {t('home.hero.title')}
        </h1>
        <p className="text-white dark:text-gray-300 max-w-2xl mx-auto">
          {t('home.hero.text')}
        </p>
        <div className="mt-6">
          <button
            onClick={handleStart}
            className="inline-block bg-[#4F46E5] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#4338CA] transition"
          >
            {t('home.hero.cta')}
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('home.features.structured.title')}
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {t('home.features.structured.text')}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('home.features.ai.title')}
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {t('home.features.ai.text')}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('home.features.weighted.title')}
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {t('home.features.weighted.text')}
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {t('home.cta.title')}
        </h2>
        <button
          onClick={handleRegister}
          className="inline-block bg-[#4F46E5] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#4338CA] transition"
        >
          {t('home.cta.button')}
        </button>
      </section>
    </div>
  )
}

export default Home
