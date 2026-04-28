import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import preact from '@astrojs/preact';

export default defineConfig({
  site: 'https://www.capitalhub.finance',
  integrations: [
    preact(),
    sitemap({
      i18n: {
        defaultLocale: 'ro',
        locales: {
          ro: 'ro-RO',
          en: 'en-US',
        },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  i18n: {
    defaultLocale: 'ro',
    locales: ['ro', 'en'],
    routing: {
      prefixDefaultLocale: true,
    },
  },
});
