import React, { createContext, useContext, useEffect, useMemo, useCallback } from 'react';
import { useApp } from './AppContext';
import fa from '../translations/fa';
import en from '../translations/en';

const dicts = { fa, en };
const LanguageContext = createContext(null);
export const useLanguage = () => useContext(LanguageContext);

function resolve(dict, key) {
  return key.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), dict);
}

export function LanguageProvider({ children }) {
  const { data, updateSettings } = useApp();
  const lang = data.settings.language || 'fa';
  const dir = lang === 'fa' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    document.body.style.fontFamily = lang === 'fa'
      ? "'Vazirmatn', 'Inter', sans-serif"
      : "'Inter', 'Vazirmatn', sans-serif";
  }, [lang, dir]);

  const t = useCallback((key, params) => {
    let val = resolve(dicts[lang], key);
    if (val === undefined) {
      console.warn(`[i18n] Missing translation for "${key}" in "${lang}"`);
      val = resolve(dicts.en, key);
    }
    if (val === undefined) return key;
    if (params && typeof val === 'string') {
      for (const [k, v] of Object.entries(params)) val = val.replace(`{${k}}`, v);
    }
    return val;
  }, [lang]);

  const setLanguage = useCallback((l) => updateSettings({ language: l }), [updateSettings]);

  const value = useMemo(() => ({ lang, dir, t, setLanguage, isRTL: dir === 'rtl' }), [lang, dir, t, setLanguage]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
