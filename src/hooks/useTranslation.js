import { useLanguage } from '../contexts/LanguageContext';

// Convenience re-export so components can `useTranslation()`
export function useTranslation() {
  return useLanguage();
}
