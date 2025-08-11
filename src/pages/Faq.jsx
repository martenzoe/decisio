import { useState } from 'react'
import { useTranslation } from 'react-i18next'

function AccordionItem({ question, answer }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition flex justify-between items-center"
      >
        <span className="font-medium text-gray-800 dark:text-gray-100">{question}</span>
        <span className="text-gray-500 dark:text-gray-300">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="px-4 py-3 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-sm">
          {answer}
        </div>
      )}
    </div>
  )
}

function Faq() {
  const { t } = useTranslation()

  const faqs = [
    {
      question: t('faq.items.q1.question'),
      answer: t('faq.items.q1.answer'),
    },
    {
      question: t('faq.items.q2.question'),
      answer: t('faq.items.q2.answer'),
    },
    {
      question: t('faq.items.q3.question'),
      answer: t('faq.items.q3.answer'),
    },
    {
      question: t('faq.items.q4.question'),
      answer: t('faq.items.q4.answer'),
    },
    {
      question: t('faq.items.q5.question'),
      answer: t('faq.items.q5.answer'),
    },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-12">
      {/* Introduction */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white dark:text-white">
          {t('faq.title')}
        </h1>
        <p className="text-white dark:text-gray-300 max-w-2xl mx-auto">
          {t('faq.intro')}
        </p>
      </section>

      {/* Accordion */}
      <section className="space-y-4">
        {faqs.map((item, index) => (
          <AccordionItem
            key={index}
            question={item.question}
            answer={item.answer}
          />
        ))}
      </section>
    </div>
  )
}

export default Faq
