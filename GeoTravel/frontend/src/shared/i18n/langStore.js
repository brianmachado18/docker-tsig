import { create } from 'zustand';
import en from '@/shared/i18n/locales/en.json';
import es from '@/shared/i18n/locales/es.json';

const translations = { en, es };

const useLangStore = create((set, get) => ({
  lang: localStorage.getItem('geotravel_lang') || 'en',
  setLang: (lang) => {
    localStorage.setItem('geotravel_lang', lang);
    set({ lang });
  },
  t: (path) => {
    const keys = path.split('.');
    let result = translations[get().lang];
    for (const key of keys) {
      if (result[key] === undefined) return path;
      result = result[key];
    }
    return result;
  }
}));

export default useLangStore;
