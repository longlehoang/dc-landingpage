# Dragon Capital landing page

A rebuild of https://www.dragoncapital.com.vn/vi/ with a **Next.js 16** frontend and a **Strapi 5** headless CMS.

```
cms/          Strapi 5.58 (TypeScript, SQLite in dev) – content model, seed script
frontend/     Next.js 16.4 (App Router, Cache Components) – renders the site from Strapi
seed-assets/  Logo, photos and hero Lottie animation from the live site, uploaded by the seed
scripts/      npm-portable.cmd – runs npm with the portable Node 22 (Node isn't installed system-wide here)
```

## Run it locally

Node 20–26 is supported (`cms/package.json`).

```bash
# 1. Install dependencies
npm --prefix cms ci
npm --prefix frontend ci

# 2. CMS: seed the content once, then start it (http://localhost:1337/admin)
npm --prefix cms run seed
npm --prefix cms run develop

# 3. Frontend (http://localhost:3000 → redirects to /vi)
npm --prefix frontend run dev
```

*(On Windows without a system-wide Node install, replace `npm` with `scripts\npm-portable.cmd`.)*

The first time you open `http://localhost:1337/admin`, Strapi asks you to create the admin account.

`npm run seed` is idempotent, and `npm run seed -- --force` overwrites the Vietnamese content. It does the following:

- generates `cms/.env` with random secrets if it does not exist yet
- makes **Vietnamese (`vi`)** the default locale
- uploads the media from `seed-assets/` and publishes the **Global** and **Homepage** single types
- gives the public role read access to Global and Homepage only
- creates a **write-only API token** (`contact-submission.create` only) for the contact form
- registers a **webhook** that tells Next.js to revalidate whenever content is published or updated
- writes `STRAPI_URL`, `STRAPI_WRITE_TOKEN` and `REVALIDATE_SECRET` to `frontend/.env.local`

## Content model (Strapi)

| Type | Kind | What editors control |
| --- | --- | --- |
| **Global** | single, i18n | logo, favicon, "Liên hệ" label, floating "Bắt đầu hành trình" card links, footer columns, legal links, copyright |
| **Homepage** | single, i18n | SEO, hero headline (coloured parts) + Lottie animation, About, Why-us features (icon + text), contact section copy and image |
| **Contact submission** | collection | leads from the "Liên Hệ Ngay" form (name, email, message, opt-in, locale); create-only API, read in the admin |

Components: `shared.link`, `shared.link-group`, `shared.seo`, `sections.headline-part`, `sections.feature`.

## How the frontend works

- `src/app/[locale]/` renders `/vi` and `/en`. `/` redirects to `/vi` (`src/proxy.ts`). If a page has no English version yet, the Vietnamese content is shown.
- `src/lib/strapi.ts` handles the Strapi reads. They are `'use cache'` functions tagged `strapi`, so pages are prerendered statically.
- When content is published, Strapi's webhook calls `POST /api/revalidate` (protected by a bearer secret), which runs `revalidateTag('strapi', 'max')`.
- The contact form is a Server Action (`src/app/actions.ts`). It validates the input, rejects bots with a honeypot field, and posts to Strapi with the write-only token, so the token never reaches the browser.
- Images go through `next/image`. The hero animation is a Lottie JSON stored in Strapi's media library.

## Notes and known gaps

- **SVG uploads are blocked** by Strapi's default upload security (XSS risk), so the logo is the live site's 2× PNG. JSON uploads are allowed (`cms/config/plugins.ts`) for the Lottie animation.
- **English content** isn't written yet. Add an `en` locale version of Global and Homepage in the Strapi admin.
- **Production**: switch Strapi to Postgres, move uploads to S3/Cloudinary (add its host to `images.remotePatterns`), set real secrets, and point the webhook at the deployed frontend URL (`FRONTEND_URL=… npm run seed`).
- The live site protects its form with reCAPTCHA. This build only has a honeypot field, so add a CAPTCHA or rate limiting before going live.
