export const defaultLocale = 'ro' as const;
export const locales = ['ro', 'en'] as const;
export type Locale = (typeof locales)[number];

export const localeLabels: Record<Locale, string> = {
  ro: 'Romana',
  en: 'English',
};

export const localeFlags: Record<Locale, string> = {
  ro: '🇷🇴',
  en: '🇬🇧',
};

export const routeMap: Record<string, Record<Locale, string>> = {
  home:           { ro: '',                 en: '' },
  services:       { ro: 'servicii',         en: 'services' },
  howWeWork:      { ro: 'cum-lucram',       en: 'how-we-work' },
  financingTypes: { ro: 'tipuri-finantare', en: 'financing-types' },
  about:          { ro: 'despre-noi',       en: 'about-us' },
  compatibility:  { ro: 'compatibilitate',  en: 'compatibility' },
  resources:      { ro: 'resurse',          en: 'resources' },
  contact:        { ro: 'contact',          en: 'contact' },
};
