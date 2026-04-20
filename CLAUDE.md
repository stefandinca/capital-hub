# Capital Hub Finance — Developer Reference

## Project Overview
Bilingual (RO/EN) financing advisory site for Capital Hub. Static Astro build with Preact islands for forms, article viewer, and admin CMS. All backend logic is client-side Firebase — no server functions.

## Tech Stack
- **Astro 6** (static) · **Preact 10** islands · **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **Firebase 12** (Firestore + Auth, client SDK only) · **SheetJS (xlsx)** for admin export
- **Sitemap** integration · **Node ≥ 22.12**

## Essential Commands
- `npm run dev` — local dev server (http://localhost:4321/dev/)
- `npm run build` — static build to `dist/`
- `npm run preview` — preview built site
- `firebase deploy --only firestore:rules,firestore:indexes` — push Firestore config
- No unit-test suite — QA is build + manual browser verification

## Directory Map
- `src/pages/ro/`, `src/pages/en/` — 8 routes per locale + `resurse/articol`, `resources/article`
- `src/pages/admin/index.astro` — admin panel entry (Preact island)
- `src/layouts/` — `BaseLayout.astro`, `PageLayout.astro`
- `src/components/` — `layout/`, `home/`, `shared/`, `resources/`, `admin/`, `seo/` (financing/forms/process/services currently empty)
- `src/i18n/` — `config.ts` (routeMap), `index.ts` (t()), `translations/{ro,en}.json`
- `src/lib/` — `firebase.ts`, `submit-compatibility.ts`, `submit-contact.ts`
- `src/data/site.ts` — phone, email, social links
- `firestore.rules`, `firestore.indexes.json`, `astro.config.mjs`

## Conventions
- **Base path**: `/dev` — every URL is prefixed; assets and links must respect it
- **i18n**: RO default, both locales prefixed (`/dev/ro/`, `/dev/en/`); add new pages in both locales and update `routeMap`
- **Firestore collections**: `compatibility_submissions`, `contact_submissions`, `articles` — schemas enforced in `firestore.rules`
- **Design tokens**: Royal Blue `#1A3C6E`, Gold `#CFAE55`, Teal `#2CA58D`, Off-white `#F6F5F2`; font Work Sans; rounded-3xl cards, blur-3xl decor, glass morphism
- **Header**: transparent over dark heros; pages without heroes need an explicit dark bar
- **JS budget**: content pages 0 JS; form pages ~30 KB gz; admin ~90 KB gz — do not regress

## Agent Orchestration
All tasks are routed automatically — users do not name agents. The main assistant reads `.claude/agents/orchestrator.md`, picks the right specialist(s) from `.claude/agents/`, executes, then tests → fixes → re-tests → commits. See `.claude/agents/orchestrator.md` for the dispatch rules.

## Reference Documents
- `.claude/agents/orchestrator.md` — dispatch rules and workflow
- `.claude/agents/*.md` — specialist agent definitions
- `firestore.rules` — canonical data contract for all submissions
- `astro.config.mjs` — base path and i18n source of truth
