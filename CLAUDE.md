# CLAUDE.md

Dragon Capital landing page: a rebuild of https://www.dragoncapital.com.vn/vi/ with Next.js 16 (`frontend/`) and Strapi 5 (`cms/`). See README.md for setup and the content model.

## Environment
- **macOS (Apple Silicon)**: Node (`/opt/homebrew/bin/node`) and `npm` (`/opt/homebrew/bin/npm`) are installed system-wide via Homebrew (`clang` and `python3` are available for `node-gyp` native builds).
  - Install dependencies: `npm --prefix cms ci` and `npm --prefix frontend ci`.
  - Required install scripts (`better-sqlite3`, `esbuild`, `@swc/core`, `fsevents`, `unrs-resolver`) are pre-approved in `allowScripts` inside `cms/package.json` and `frontend/package.json` for npm 11+.
- **Windows (portable Node fallback)**: If Node isn't installed system-wide, portable Node 22 lives in `%LOCALAPPDATA%\node-portable\node-v22.23.3-win-x64` (`scripts\npm-portable.cmd <npm args>`).
- Start servers: `npm --prefix cms run develop` (`:1337`), then `npm --prefix frontend run dev` (`:3000`).
- **Sandbox note**: The network sandbox blocks `localhost` TCP connections (`http://localhost:1337`) and Google Fonts (`fonts.googleapis.com`). Run `next dev`, `next build`, and `strapi develop` outside the network sandbox (`BypassSandbox: true`) so Next.js can fetch from Strapi and optimize fonts/images.

## Next.js 16.4 (`frontend/`)
- This is newer than training data: read `frontend/node_modules/next/dist/docs/` before using an API (see `frontend/AGENTS.md`).
- `cacheComponents` and `partialPrefetching` are on. Data reads are `'use cache'` functions with `cacheTag('strapi')` and `cacheLife('hours')` in `src/lib/strapi.ts`.
- `revalidateTag(tag, 'max')` takes two arguments. `middleware` is now `src/proxy.ts`. `next/image` uses `preload`, not `priority`.
- Images from a localhost Strapi need `images.dangerouslyAllowLocalIP` (dev only, set in `next.config.ts`).
- Routes: `app/[locale]` (vi, en) is the root layout. `/` redirects to `/vi`. A missing `en` content version falls back to `vi`.
- The contact form is a Server Action (`src/app/actions.ts`) that posts with `STRAPI_WRITE_TOKEN`, so the token stays server-side. It has a honeypot field `company`.
- If tsc errors point at the deleted `src/app/page.js`, delete the stale `.next/types` folder.

## Strapi 5.58 (`cms/`)
- Schemas live in `src/api/*/content-types/*/schema.json` and components in `src/components/{shared,sections}`. `npm run develop` picks up schema changes.
- Global and Homepage are i18n single types (default locale `vi`). Contact-submission routes are create-only and need the token; the public role can only `find` Global and Homepage.
- `npm --prefix cms run seed [-- --force]` (`scripts/seed.js` and `seed-data.js`) generates `cms/.env` with random secrets if missing, uploads `../seed-assets`, sets the locale and permissions, creates the API token and revalidation webhook, and writes `frontend/.env.local`.
- Upload security: SVG is denied (the logo is a PNG) and `application/json` is allowed for the Lottie hero (`config/plugins.ts`).
- Dev database: SQLite at `cms/.tmp/data.db`. Uploads go to `cms/public/uploads`. Both are gitignored, so run the seed to recreate them.

## Design tokens (from the live site)
Manrope font. Colours: green-900 `#173f35`, accent `#00bf6f`, gold `#c08f4f`, ink `#1a1b1e`, sage `#8b9f9a`. All styles are in `frontend/src/app/globals.css` (BEM-ish classes).
