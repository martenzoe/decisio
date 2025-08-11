import React from 'react'
import { useForm, ValidationError } from '@formspree/react'
import { useTranslation } from 'react-i18next'

function Kontakt() {
  const { t } = useTranslation()
  const [state, handleSubmit] = useForm('xgvkbaqa')

  if (state.succeeded) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-3xl font-bold text-green-600">{t('contact.success.title')}</h1>
        <p className="text-white dark:text-gray-300">{t('contact.success.message')}</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 space-y-10">
      {/* Intro */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white dark:text-white">{t('contact.title')}</h1>
        <p className="text-white dark:text-gray-300 max-w-xl mx-auto">{t('contact.intro')}</p>
      </section>

      {/* Contact Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-6"
        encType="multipart/form-data"
      >
        {/* Name */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="firstname" className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
              {t('contact.form.firstname.label')}
            </label>
            <input
              id="firstname"
              type="text"
              name="firstname"
              placeholder={t('contact.form.firstname.placeholder')}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="lastname" className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
              {t('contact.form.lastname.label')}
            </label>
            <input
              id="lastname"
              type="text"
              name="lastname"
              placeholder={t('contact.form.lastname.placeholder')}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
            {t('contact.form.email.label')}
          </label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder={t('contact.form.email.placeholder')}
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
          />
          <ValidationError prefix="Email" field="email" errors={state.errors} className="text-red-500 text-sm mt-1" />
        </div>

        {/* Topic */}
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
            {t('contact.form.topic.label')}
          </label>
          <input
            id="topic"
            type="text"
            name="topic"
            placeholder={t('contact.form.topic.placeholder')}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
          />
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
            {t('contact.form.message.label')}
          </label>
          <textarea
            id="message"
            name="message"
            placeholder={t('contact.form.message.placeholder')}
            rows="5"
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
          />
          <ValidationError prefix="Message" field="message" errors={state.errors} className="text-red-500 text-sm mt-1" />
        </div>

        {/* File Upload */}
        <div>
          <label htmlFor="attachment" className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
            {t('contact.form.attachment.label')}
          </label>
          <input
            id="attachment"
            type="file"
            name="attachment"
            className="w-full text-sm text-gray-700 dark:text-gray-300"
          />
        </div>

        {/* DSGVO Consent */}
        <div className="flex items-start gap-2">
          <input
            id="consent"
            type="checkbox"
            name="consent"
            required
            className="mt-1"
          />
          <label htmlFor="consent" className="text-sm text-gray-700 dark:text-gray-300">
            {t('contact.form.consent.text')}{' '}
            <a href="/privacy" className="underline text-[#4F46E5] dark:text-blue-400">{t('contact.form.consent.link')}</a>.
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={state.submitting}
          className="bg-[#4F46E5] text-white font-medium px-6 py-2 rounded-lg hover:bg-[#4338CA] transition disabled:opacity-50"
        >
          {state.submitting ? t('contact.form.submit.sending') : t('contact.form.submit.default')}
        </button>
      </form>
    </div>
  )
}

export default Kontakt
