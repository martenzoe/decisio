import { useState } from 'react'

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
  const faqs = [
    {
      question: 'What is Decisia?',
      answer: 'Decisia is a decision-making app that helps you evaluate complex choices by defining your own options and criteria. You can score manually or use AI assistance (GPT) for automatic, transparent evaluation.',
    },
    {
      question: 'How does the AI scoring work?',
      answer: 'When using the AI mode, GPT analyzes your decision context and criteria, then assigns scores and provides explanations for each option. This gives you an objective and structured overview.',
    },
    {
      question: 'Do I need an account to use Decisia?',
      answer: 'Yes. You need to register for a free account to create, save, and access your decisions.',
    },
    {
      question: 'Can I use Decisia for private and business decisions?',
      answer: 'Absolutely. Decisia is flexible enough for both personal choices (e.g. job offers, purchases) and business-related decisions (e.g. vendor selection, hiring).',
    },
    {
      question: 'Is my data safe?',
      answer: 'Your decisions are stored securely. We use modern authentication and do not share your data with third parties. You can delete your data at any time.',
    },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-12">
      {/* Introduction */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white dark:text-white">Frequently Asked Questions</h1>
        <p className="text-white dark:text-gray-300 max-w-2xl mx-auto">
          Need clarity about how Decisia works? Here you’ll find answers to the most common questions about our app, features, and decision-making process.
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
