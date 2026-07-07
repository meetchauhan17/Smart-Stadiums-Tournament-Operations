import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useCallback } from 'react';
import i18n from '../i18n';
import { SUPPORTED_LANGUAGES } from '../data/languages';

/**
 * useTranslation — StadiumIQ translation hook
 *
 * Thin wrapper around react-i18next with stadium-specific helpers.
 */
export function useTranslation() {
  const { t, i18n: i18nInstance } = useI18nTranslation();

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === i18nInstance.language)
    || SUPPORTED_LANGUAGES[0];

  const changeLanguage = useCallback((langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('stadiumiq_lang', langCode);

    // Handle RTL languages
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    if (lang) {
      document.documentElement.dir  = lang.dir;
      document.documentElement.lang = lang.code;
    }
  }, []);

  return {
    t,
    currentLang,
    changeLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    isRTL: currentLang.dir === 'rtl',
  };
}
