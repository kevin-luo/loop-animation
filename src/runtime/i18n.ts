export type AppLanguage = 'zh' | 'en';

const STORAGE_KEY = 'loop-animation-language';

export function getLanguage(): AppLanguage {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get('lang');
  if (fromUrl === 'zh' || fromUrl === 'en') return fromUrl;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'zh' || saved === 'en') return saved;
  } catch {
    // Storage may be unavailable in strict privacy contexts.
  }

  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function persistLanguage(language: AppLanguage) {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Ignore storage failures; the URL still carries the selected language.
  }
}

export function withLanguage(url: URL, language: AppLanguage) {
  url.searchParams.set('lang', language);
  return url;
}

export function setUrlLanguage(language: AppLanguage) {
  const url = new URL(window.location.href);
  url.searchParams.set('lang', language);
  history.replaceState({}, '', url);
  persistLanguage(language);
}

export function choose<T>(language: AppLanguage, copy: { zh: T; en: T }): T {
  return language === 'zh' ? copy.zh : copy.en;
}
