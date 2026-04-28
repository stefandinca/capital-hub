import { defaultLocale, locales, routeMap, type Locale } from './config';
import ro from './translations/ro.json';
import en from './translations/en.json';

const translations: Record<string, Record<string, unknown>> = { ro, en };

export function t(locale: string, key: string): string {
  const lang = locales.includes(locale as Locale) ? locale : defaultLocale;
  const keys = key.split('.');
  let value: unknown = translations[lang];
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      // Fallback to default locale
      let fallback: unknown = translations[defaultLocale];
      for (const fk of keys) {
        if (fallback && typeof fallback === 'object' && fk in fallback) {
          fallback = (fallback as Record<string, unknown>)[fk];
        } else {
          return key;
        }
      }
      return typeof fallback === 'string' ? fallback : key;
    }
  }
  return typeof value === 'string' ? value : key;
}

export function getLocalePath(locale: string, pageKey: string): string {
  const slug = routeMap[pageKey]?.[locale as Locale] ?? '';
  return slug ? `/${locale}/${slug}` : `/${locale}`;
}

export function getAlternates(pageKey: string) {
  return locales.map((loc) => ({
    locale: loc,
    hreflang: loc === 'ro' ? 'ro' : 'en',
    href: `https://www.capitalhub.finance${getLocalePath(loc, pageKey)}`,
  }));
}

export { defaultLocale, locales, routeMap, type Locale } from './config';
