// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import de from './locales/de.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
    },
    ns: ['translation'],
    defaultNS: 'translation',
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    debug: false, // set to true if you want i18next console logs
  });

// sync once from Zustand (initial)
import { useLanguageStore } from './store/useLanguageStore';
i18n.changeLanguage(useLanguageStore.getState().lang);

// react to store changes too
useLanguageStore.subscribe((state) => {
  if (i18n.language !== state.lang) i18n.changeLanguage(state.lang);
});

// quick sanity logs (remove later)
if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line no-console
  console.log('[i18n] current:', i18n.language, {
    hasDE: i18n.hasResourceBundle('de', 'translation'),
    hasEN: i18n.hasResourceBundle('en', 'translation'),
  });
}

export default i18n;
