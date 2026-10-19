'use strict';

/**
 * Seeds Strapi with the Dragon Capital homepage content.
 *
 *   npm run seed            # create content if it does not exist yet
 *   npm run seed -- --force # overwrite the Vietnamese global + homepage content
 *
 * Also: makes Vietnamese the default locale, opens read access for the public
 * role, creates a write-only API token for the contact form and a webhook that
 * revalidates the Next.js cache. Token + webhook secret go to ../frontend/.env.local.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createStrapi, compileStrapi } = require('@strapi/strapi');
const data = require('./seed-data');

const LOCALE = 'vi';
const ASSET_DIR = path.join(__dirname, '..', '..', 'seed-assets');
const FRONTEND_ENV = path.join(__dirname, '..', '..', 'frontend', '.env.local');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const TOKEN_NAME = 'nextjs-contact-form';
const WEBHOOK_NAME = 'nextjs-revalidate';
const force = process.argv.includes('--force');

async function ensureLocale(strapi) {
  const locales = strapi.plugin('i18n').service('locales');
  if (!(await locales.findByCode(LOCALE))) {
    await locales.create({ code: LOCALE, name: 'Vietnamese (vi)' });
  }
  await locales.setDefaultLocale({ code: LOCALE });
}

async function grantPublic(strapi, actions) {
  const role = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'public' } });
  for (const action of actions) {
    const exists = await strapi.db
      .query('plugin::users-permissions.permission')
      .findOne({ where: { action, role: role.id } });
    if (!exists) {
      await strapi.db.query('plugin::users-permissions.permission').create({ data: { action, role: role.id } });
    }
  }
}

async function uploadFile(strapi, { file, mime, alt }) {
  const existing = await strapi.db.query('plugin::upload.file').findOne({ where: { name: file } });
  if (existing) return existing;
  const filepath = path.join(ASSET_DIR, file);
  const [uploaded] = await strapi
    .plugin('upload')
    .service('upload')
    .upload({
      files: { filepath, originalFilename: file, mimetype: mime, size: fs.statSync(filepath).size },
      data: { fileInfo: { name: file, alternativeText: alt, caption: alt } },
    });
  return uploaded;
}

async function upsertSingleType(strapi, uid, content) {
  const docs = strapi.documents(uid);
  const existing = await docs.findFirst({ locale: LOCALE });
  if (existing && !force) {
    console.log(`  ${uid}: already has content, skipped (use --force to overwrite)`);
    return;
  }
  if (existing) {
    await docs.update({ documentId: existing.documentId, locale: LOCALE, data: content });
    await docs.publish({ documentId: existing.documentId, locale: LOCALE });
  } else {
    await docs.create({ locale: LOCALE, data: content, status: 'published' });
  }
  console.log(`  ${uid}: seeded`);
}

async function ensureApiToken(strapi) {
  const tokens = strapi.service('admin::api-token');
  const existing = await tokens.getByName(TOKEN_NAME);
  if (existing) {
    const { accessKey } = await tokens.regenerate(existing.id);
    return accessKey;
  }
  const { accessKey } = await tokens.create({
    name: TOKEN_NAME,
    description: 'Lets the Next.js server create contact submissions. Nothing else.',
    type: 'custom',
    lifespan: null,
    permissions: ['api::contact-submission.contact-submission.create'],
  });
  return accessKey;
}

async function ensureWebhook(strapi, secret) {
  const store = strapi.get('webhookStore');
  const hooks = await store.findWebhooks();
  const def = {
    name: WEBHOOK_NAME,
    url: `${FRONTEND_URL}/api/revalidate`,
    headers: { Authorization: `Bearer ${secret}` },
    events: ['entry.create', 'entry.update', 'entry.delete', 'entry.publish', 'entry.unpublish', 'media.update'],
    isEnabled: true,
  };
  const existing = hooks.find(h => h.name === WEBHOOK_NAME);
  if (existing) await store.updateWebhook(existing.id, def);
  else await store.createWebhook(def);
}

function writeFrontendEnv(values) {
  let current = fs.existsSync(FRONTEND_ENV) ? fs.readFileSync(FRONTEND_ENV, 'utf8') : '';
  for (const [key, value] of Object.entries(values)) {
    const line = `${key}=${value}`;
    const re = new RegExp(`^${key}=.*$`, 'm');
    current = re.test(current) ? current.replace(re, line) : `${current.trimEnd()}\n${line}\n`.trimStart();
  }
  fs.mkdirSync(path.dirname(FRONTEND_ENV), { recursive: true });
  fs.writeFileSync(FRONTEND_ENV, current.endsWith('\n') ? current : `${current}\n`);
}

async function main() {
  const app = await createStrapi(await compileStrapi()).load();
  app.log.level = 'error';
  try {
    console.log('Locale…');
    await ensureLocale(app);

    console.log('Public permissions…');
    await grantPublic(app, ['api::global.global.find', 'api::homepage.homepage.find']);

    console.log('Media…');
    const media = {};
    for (const [key, def] of Object.entries(data.files)) media[key] = await uploadFile(app, def);

    console.log('Content…');
    await upsertSingleType(app, 'api::global.global', {
      ...data.global,
      logo: media.logo.id,
      favicon: media.favicon.id,
    });
    await upsertSingleType(app, 'api::homepage.homepage', {
      ...data.homepage,
      heroAnimation: media.heroAnimation.id,
      aboutImage: media.aboutImage.id,
      contactImage: media.contactImage.id,
    });

    console.log('API token + revalidation webhook…');
    const token = await ensureApiToken(app);
    const secret = crypto.randomBytes(24).toString('hex');
    await ensureWebhook(app, secret);
    writeFrontendEnv({
      STRAPI_URL: `http://localhost:${app.config.get('server.port', 1337)}`,
      STRAPI_WRITE_TOKEN: token,
      REVALIDATE_SECRET: secret,
    });
    console.log(`  wrote ${path.relative(process.cwd(), FRONTEND_ENV)}`);
    console.log('Done.');
  } finally {
    await app.destroy();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
