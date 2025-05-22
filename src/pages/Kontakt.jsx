import React from 'react'
import { useForm, ValidationError } from '@formspree/react'

function Kontakt() {
  const [state, handleSubmit] = useForm('xgvkbaqa')

  if (state.succeeded) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-3xl font-bold text-green-600">Thank you! ✅</h1>
        <p className="text-white dark:text-gray-300">Your message has been sent. We'll get back to you shortly.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 space-y-10">
      {/* Header */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white dark:text-white">Get in Touch</h1>
        <p className="text-white dark:text-gray-300 max-w-xl mx-auto">
          Have a question, feature request, or partnership idea? Just drop us a message and we'll respond as soon as possible.
        </p>
      </section>

      {/* Contact Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-6">
        {/* Name fields */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="firstname" className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
              First Name
            </label>
            <input
              id="firstname"
              type="text"
              name="firstname"
              placeholder="e.g. Sarah"
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="lastname" className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
              Last Name
            </label>
            <input
              id="lastname"
              type="text"
              name="lastname"
              placeholder="e.g. Connor"
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="you@example.com"
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
          />
          <ValidationError prefix="Email" field="email" errors={state.errors} className="text-red-500 text-sm mt-1" />
        </div>

        {/* Topic */}
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
            Topic
          </label>
          <input
            id="topic"
            type="text"
            name="topic"
            placeholder="e.g. Feature request, Bug report, Feedback"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
          />
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows="5"
            placeholder="Tell us what’s on your mind..."
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
          />
          <ValidationError prefix="Message" field="message" errors={state.errors} className="text-red-500 text-sm mt-1" />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={state.submitting}
          className="bg-[#4F46E5] text-white font-medium px-6 py-2 rounded-lg hover:bg-[#4338CA] transition disabled:opacity-50"
        >
          {state.submitting ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  )
}

export default Kontakt
