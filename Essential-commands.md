# Essential Commands

Quick reference for the commands you run most often on Capital Hub Finance. All commands are run from the repo root (`capital-hub/`) unless noted.

## Dev server
```bash
npm run dev
```
Starts Astro dev at http://localhost:4321/dev/ with HMR. Use for all local work.

## Production build
```bash
npm run build
```
Outputs the static site to `dist/`. Twenty pages (10 per locale + admin + root redirect) plus a sitemap.

## Preview the build locally
```bash
npm run preview
```
Serves the already-built `dist/` on a local port — use to sanity-check before uploading to Plesk.

## Package management
```bash
npm install            # install deps from package-lock.json (first clone / after a pull)
npm install <pkg>      # add a new dependency (updates package.json + lockfile)
npm update             # upgrade to the latest allowed semver range
npm outdated           # show packages with newer versions available
npm audit              # report known vulnerabilities
npm ci                 # clean, reproducible install (CI / before release builds)
```
Node must be ≥ 22.12 (see `engines` in `package.json`).

## Firestore rules & indexes
Prereqs: `npm install -g firebase-tools` once, then `firebase login`.

```bash
firebase use capitalhub-85722                                    # select the project
firebase deploy --only firestore:rules                           # deploy rules only
firebase deploy --only firestore:indexes                         # deploy indexes only
firebase deploy --only firestore:rules,firestore:indexes         # deploy both together
```
Rules are read from `firestore.rules`; indexes from `firestore.indexes.json` (both at repo root, declared in `firebase.json`). Deploys hit production — confirm before running.

## Update the live site via Plesk (File Manager)
The site lives under `/dev/` on the Plesk host. The deploy is a manual static upload — there is no CI pipeline.

1. **Build locally**
   ```bash
   npm run build
   ```
   Verify `dist/` contains fresh `index.html`, `ro/`, `en/`, `admin/`, `_astro/`, `sitemap-*.xml`, etc.
2. **Smoke test**
   ```bash
   npm run preview
   ```
   Open the preview URL and click through the pages you changed (both RO and EN).
3. **Log into Plesk** → open the domain's **File Manager**.
4. **Navigate to `/httpdocs/dev/`** (or whatever directory maps to `capitalhub.finance/dev/`).
5. **Back up the current folder** — right-click `dev/` → *Copy* to `dev-backup-YYYYMMDD/`. Keep one or two prior backups so you can roll back.
6. **Delete the old contents** of `/dev/` (keep the `dev/` folder itself). If Plesk gets slow with many files, delete in batches.
7. **Upload the new build** — in File Manager, click *Upload*, select **all contents of your local `dist/`** (not the `dist` folder itself — upload the files inside it). Plesk accepts a single ZIP: zip `dist/*` locally, upload the zip, then use File Manager's *Extract* action inside `/dev/`, then delete the zip.
8. **Verify permissions** — files should be `644`, folders `755`. Use File Manager's *Change Permissions* if anything looks off.
9. **Smoke test live** — visit:
    - `https://capitalhub.finance/dev/` (redirects to default locale)
    - `https://capitalhub.finance/dev/ro/` and `/dev/en/`
    - one form page (submit a test entry)
    - `/dev/admin/` (login still works)
10. **If something is broken**, restore by renaming the backup folder back to `dev/` in Plesk File Manager.

### Notes
- The `/dev` base path is set in `astro.config.mjs`. If the hosting path ever changes, update `base` and rebuild before uploading.
- Do not upload `node_modules/`, `src/`, `.git/`, or the raw `dist/` folder wrapper — only the built file tree.
- Firestore rules and indexes are deployed via `firebase deploy` (above), **not** through Plesk.
