# Dragon Capital landing page

A rebuild of https://www.dragoncapital.com.vn/vi/ with a **Next.js 16** frontend and a **Strapi 5** headless CMS.

The rebuild covers the landing page and its sub-sites, which the live site serves from Salesforce Experience Cloud:

| Route (`/vi` or `/en` prefix) | What it is |
| --- | --- |
| `/` | Landing page (Global + Homepage) |
| `/individual`, `/individual/{about,faq,report,contact,news-and-insights}` | Retail investor site |
| `/institution`, `/institution/{about,faq,report,contact,pension,sma,news-and-insights}` | Institutional investor site |
| `/{individual,institution}/product/<slug>` | Fund pages (dcds, dcde, dcip, dcbf, dcba, vn30, vndiamond, vnmidcap, thinh-an, phuc-an) |
| `/{individual,institution}/news-and-insights/<slug>` | News articles |
| `/regulatory` | Regulatory disclosure library (all funds, all years) |
| `/contact`, `/terms`, `/policy` | Corporate pages |

Content is a snapshot of the live site taken on 2026-10-19, including fund NAV and performance data and the document lists. It is not synced with the live site.

```
cms/          Strapi 5.58 (TypeScript, SQLite in dev) – content model, seed script
frontend/     Next.js 16.4 (App Router, Cache Components) – renders the site from Strapi
seed-assets/  Logo, photos and hero Lottie animation from the live site, uploaded by the seed
              (content/: images, icons and animations of the sub-sites)
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

`npm run seed` is idempotent, and `npm run seed -- --force` overwrites the seeded content. It does the following:

- generates `cms/.env` with random secrets if it does not exist yet
- makes **Vietnamese (`vi`)** the default locale and adds **English (`en`)**
- uploads the media from `seed-assets/` and publishes the **Global** and **Homepage** single types
- imports the sub-site content from `cms/scripts/content/` (sites, pages, funds, articles, document taxonomy in vi and en, and about 48k fund documents) and uploads the images it references
- gives the public role read access to the content types listed below, but never to contact submissions
- creates a **write-only API token** (`contact-submission.create` only) for the contact form
- registers a **webhook** that tells Next.js to revalidate whenever content is published or updated
- writes `STRAPI_URL`, `STRAPI_WRITE_TOKEN` and `REVALIDATE_SECRET` to `frontend/.env.local`

## Content model (Strapi)

| Type | Kind | What editors control |
| --- | --- | --- |
| **Global** | single, i18n | logo, favicon, "Liên hệ" label, floating "Bắt đầu hành trình" card links, footer columns, legal links, copyright |
| **Homepage** | single, i18n | SEO, hero headline (coloured parts) + Lottie animation, About, Why-us features (icon + text), contact section copy and image |
| **Site** | collection, i18n | header and footer of one sub-site (`corporate`, `individual`, `institution`, `regulatory`): logo, label, nav with dropdown groups, header CTA, footer columns, socials, app links, DragonX dialog, Zalo link |
| **Page** | collection, i18n | one sub-site page: `path` (e.g. `individual/about`), `site`, SEO and `sections`, a dynamic zone of `blocks.*` |
| **Fund** | collection, i18n | one fund page per audience: hero, key facts, fees, managers, strategy, plus snapshot data (NAV history, performance, portfolio, ETF pricing) stored as JSON |
| **Article** | collection, i18n | news and insights: title, slug, category (CAT1–CAT5), date, cover, markdown body, attachments |
| **Fund document** | collection | regulatory and fund documents: fund code, type, category, year, vi/en titles, file URL, `inVi`/`inEn` |
| **Document taxonomy** | single, i18n | labels for document funds, types and categories, and the library UI |
| **Contact submission** | collection | leads from every "Liên Hệ Ngay" form (name, company, email, phone, message, opt-in, locale, page); create-only API, read in the admin |

Page blocks (`cms/src/components/blocks`): hero (banner, page title, carousel), rich text, cards (grid, solutions, accordion, offices, logos, benefits, CTA banner), features, stats, testimonials, fund cards, app promo, news feed, news index, timeline, team, contact form, FAQ, document library, anchor nav, and video carousel.

Other components: `shared.link`, `shared.link-group`, `shared.nav-item`, `shared.nav-group`, `shared.social-link`, `shared.key-value`, `shared.contact-item`, `shared.seo`, `sections.headline-part`, `sections.feature`, `fund.manager`.

### Refreshing the snapshot

`cms/scripts/convert-crawl.py <crawl-dir>` turns a crawl of the live site into `cms/scripts/content/*` and `seed-assets/content/`. The crawl itself was done once, with REA browser captures and the live site's public CMS/Apex responses, and isn't part of the repo. After converting, run `npm --prefix cms run seed -- --force`.

## How the frontend works

- `src/app/[locale]/` renders `/vi` and `/en`. `/` redirects to `/vi` (`src/proxy.ts`). If a page has no English version yet, the Vietnamese content is shown.
- `src/app/[locale]/[...path]/page.tsx` serves every sub-site URL. `<site>/product/<slug>` is a Fund, `<site>/news-and-insights/<slug>` is an Article, and any other path is looked up as a Page. `SiteShell` wraps the result in that sub-site's header and footer, and `components/blocks/Blocks.tsx` renders the page sections.
- In-app links are stored in the CMS without a locale (`/individual/faq`). `SmartLink` and `Markdown` add the current locale when rendering.
- `src/lib/strapi.ts` handles the Strapi reads. They are `'use cache'` functions tagged `strapi`, so pages are prerendered statically.
- When content is published, Strapi's webhook calls `POST /api/revalidate` (protected by a bearer secret), which runs `revalidateTag('strapi', 'max')`.
- The contact form is a Server Action (`src/app/actions.ts`). It validates the input, rejects bots with a honeypot field, and posts to Strapi with the write-only token, so the token never reaches the browser.
- Images go through `next/image`. The hero animation is a Lottie JSON stored in Strapi's media library.

## Notes and known gaps

- **SVG uploads are blocked** by Strapi's default upload security (XSS risk), so the logo is the live site's 2× PNG. JSON uploads are allowed (`cms/config/plugins.ts`) for the Lottie animation.
- **English content** for Global and Homepage isn't written yet. Add an `en` locale version in the Strapi admin. The sub-sites are seeded in both languages.
- **Snapshot data**: fund NAVs, performance, portfolios and documents are as of 2026-10-19. A live feed would need an integration with Dragon Capital's fund data source.
- **Document types**: every fund document uses the regulatory site's type/category labels, including on the individual and institution report pages, where the live site uses slightly different groupings.
- **Production**: switch Strapi to Postgres, move uploads to S3/Cloudinary (add its host to `images.remotePatterns`), set real secrets, and point the webhook at the deployed frontend URL (`FRONTEND_URL=… npm run seed`).
- The live site protects its forms with reCAPTCHA. This build only has a honeypot field (`website`), so add a CAPTCHA or rate limiting before going live.
