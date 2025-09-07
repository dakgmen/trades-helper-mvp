import { createContext, useContext } from 'react';

interface TranslationContextType {
  currentLanguage: string;
  translations: Record<string, string>;
  setLanguage: (code: string) => void;
  t: (key: string, params?: Record<string, string>) => string;
  isLoading: boolean;
}

export const TranslationContext = createContext<TranslationContextType | null>(null);

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider');
  }
  return context;
};