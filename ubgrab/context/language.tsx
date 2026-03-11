import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { getStoredLocale, setStoredLocale, type Locale } from '@/lib/language-storage';
import { translate, type TranslationKey } from '@/i18n/translations';

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ru');

  useEffect(() => {
    let cancelled = false;
    getStoredLocale().then((lang) => {
      if (!cancelled) setLocaleState(lang);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = useCallback(async (lang: Locale) => {
    await setStoredLocale(lang);
    setLocaleState(lang);
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      translate(locale, key, params),
    [locale]
  );

  const value: LanguageContextValue = { locale, setLocale, t };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
