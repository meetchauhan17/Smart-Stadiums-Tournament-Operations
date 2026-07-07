import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import local JSON translation resources
import enTranslation from './i18n/en.json';
import esTranslation from './i18n/es.json';
import arTranslation from './i18n/ar.json';
import frTranslation from './i18n/fr.json';
import ptTranslation from './i18n/pt.json';

const resources = {
  en: { translation: enTranslation },
  es: { translation: esTranslation },
  ar: { translation: arTranslation },
  fr: { translation: frTranslation },
  pt: { translation: ptTranslation },
};

// Automatic language detection (localStorage or browser language or English default)
const detectLanguage = () => {
  const saved = localStorage.getItem('stadiumiq_lang');
  if (saved) return saved;

  const browserLang = navigator.language ? navigator.language.split('-')[0] : 'en';
  return resources[browserLang] ? browserLang : 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: detectLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already safeguards from XSS
    },
    react: {
      useSuspense: false,
    },
  });

// Handle RTL support for Arabic and update DOM direction automatically on change
const updateLayoutDirection = (lng) => {
  const dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
  localStorage.setItem('stadiumiq_lang', lng);
};

// Fire initial direction check
updateLayoutDirection(i18n.language);

// Bind event listener for runtime switches
i18n.on('languageChanged', updateLayoutDirection);

export default i18n;
