import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { getConnInfo } from '@hono/node-server/conninfo';
import { Hono, Context } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { openStore } from './db.js';
import { validateCardInput } from './validation.js';
import { buildVcf, contentDisposition } from './vcf.js';
import { qrPng, qrSvg, qrTargetUrl } from './qr.js';
import { RateLimiter } from './ratelimit.js';
import { cardPage, notFoundPage, UmamiConfig } from './render/cardPage.js';
import { homePage } from './render/homePage.js';
import { Lang } from './types.js';

const PORT = Number(process.env.PORT ?? 3000);
const DB_PATH = process.env.DB_PATH ?? './data/bitaqati.db';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? '';
const UMAMI: UmamiConfig =
  process.env.UMAMI_SRC && process.env.UMAMI_WEBSITE_ID
    ? { src: process.env.UMAMI_SRC, websiteId: process.env.UMAMI_WEBSITE_ID }
    : undefined;

mkdirSync(dirname(DB_PATH), { recursive: true });
export const store = openStore(DB_PATH);

/* Rate limits, per IP. Kept loose enough for shared networks (conference
   venues, offices, carrier-grade NAT) where many visitors share one IP. */
const createLimit = new RateLimiter(10, 60 * 60 * 1000); // creations / hour
const editLimit = new RateLimiter(100, 60 * 60 * 1000); // edits / hour
const reportLimit = new RateLimiter(5, 60 * 60 * 1000); // reports / hour
const assetLimit = new RateLimiter(300, 60 * 1000); // vcf+qr / minute
setInterval(() => [createLimit, editLimit, reportLimit, assetLimit].forEach((l) => l.sweep()), 10 * 60 * 1000).unref();

const app = new Hono();

function clientIp(c: Context): string {
  const fromHeaders =
    c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for')?.split(',')[0]?.trim();
  if (fromHeaders) return fromHeaders;
  try {
    return getConnInfo(c).remote.address ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

function baseUrl(c: Context): string {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/$/, '');
  const proto = c.req.header('x-forwarded-proto') ?? 'http';
  return `${proto}://${c.req.header('host') ?? `localhost:${PORT}`}`;
}

function pickLangParam(c: Context, fallback: Lang): Lang {
  const lang = c.req.query('lang');
  return lang === 'ar' || lang === 'en' ? lang : fallback;
}

/* Security headers on every response; CSP on HTML */
app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (c.res.headers.get('content-type')?.includes('text/html')) {
    const umamiOrigin = UMAMI ? new URL(UMAMI.src).origin : '';
    const cfScript = process.env.CF_BEACON_TOKEN ? ' https://static.cloudflareinsights.com' : '';
    const cfConnect = process.env.CF_BEACON_TOKEN ? ' https://cloudflareinsights.com' : '';
    c.header(
      'Content-Security-Policy',
      [
        "default-src 'none'",
        `script-src 'self'${umamiOrigin ? ` ${umamiOrigin}` : ''}${cfScript}`,
        "style-src 'self' https://fonts.googleapis.com",
        'font-src https://fonts.gstatic.com',
        "img-src 'self' data:",
        `connect-src 'self'${umamiOrigin ? ` ${umamiOrigin}` : ''}${cfConnect}`,
        "base-uri 'none'",
        "form-action 'self'",
        "frame-ancestors 'none'",
      ].join('; ')
    );
  }
});

/* Static assets: cacheable at the edge and in browsers (they only change on
   deploys, and a stale hour of CSS/JS is harmless) */
app.use('/styles.css', async (c, next) => {
  await next();
  if (c.res.ok) c.header('Cache-Control', 'public, max-age=3600');
});
app.use('/js/*', async (c, next) => {
  await next();
  if (c.res.ok) c.header('Cache-Control', 'public, max-age=3600');
});
app.use('/styles.css', serveStatic({ root: './public' }));
app.use('/js/*', serveStatic({ root: './public' }));

/* API bodies are small JSON; cap them well before any parser sees them */
app.use('/api/*', bodyLimit({ maxSize: 32 * 1024 }));

app.get('/healthz', (c) => c.json({ ok: true }));

/* The landing page has no per-visitor content (the edit form is a separate
   route), so the edge can absorb its traffic too */
app.get('/', (c) => {
  c.header('Cache-Control', 'public, s-maxage=300, max-age=60');
  return c.html(homePage(UMAMI ? { umami: UMAMI } : {}));
});

/* ------------------------------------------------------------------ */
/* API                                                                 */
/* ------------------------------------------------------------------ */

app.post('/api/cards', async (c) => {
  if (!createLimit.hit(clientIp(c))) return c.json({ errors: ['rate limit: try again later'] }, 429);
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ errors: ['invalid JSON'] }, 400);
  }
  const result = validateCardInput(body);
  if (!result.ok) return c.json({ errors: result.errors }, 400);

  const { card, editToken } = store.create(result.card);
  const base = baseUrl(c);
  return c.json(
    {
      id: card.id,
      url: `${base}/${card.id}`,
      editUrl: `${base}/${card.id}/edit?token=${editToken}`,
      editToken,
    },
    201
  );
});

app.put('/api/cards/:id', async (c) => {
  if (!editLimit.hit(clientIp(c))) return c.json({ errors: ['rate limit: try again later'] }, 429);
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ errors: ['invalid JSON'] }, 400);
  }
  const { editToken, ...rest } = (body ?? {}) as Record<string, unknown>;
  if (typeof editToken !== 'string' || !editToken) return c.json({ errors: ['editToken required'] }, 403);
  const result = validateCardInput(rest);
  if (!result.ok) return c.json({ errors: result.errors }, 400);

  const outcome = store.update(c.req.param('id'), editToken, result.card);
  if (outcome === 'not-found') return c.json({ errors: ['not found'] }, 404);
  if (outcome === 'forbidden') return c.json({ errors: ['wrong edit token'] }, 403);
  return c.json({ ok: true });
});

app.post('/api/cards/:id/report', async (c) => {
  if (!reportLimit.hit(clientIp(c))) return c.json({ errors: ['rate limit'] }, 429);
  let reason = '';
  try {
    const body = (await c.req.json()) as { reason?: unknown };
    if (typeof body.reason === 'string') reason = body.reason;
  } catch {
    /* empty reason is allowed */
  }
  const ok = store.report(c.req.param('id'), reason || '(no reason given)', clientIp(c));
  return ok ? c.json({ ok: true }) : c.json({ errors: ['not found'] }, 404);
});

app.post('/api/admin/cards/:id/unpublish', (c) => {
  const auth = c.req.header('authorization') ?? '';
  if (!ADMIN_TOKEN || auth !== `Bearer ${ADMIN_TOKEN}`) return c.json({ errors: ['forbidden'] }, 403);
  return store.unpublish(c.req.param('id')) ? c.json({ ok: true }) : c.json({ errors: ['not found'] }, 404);
});

/* ------------------------------------------------------------------ */
/* Card pages & assets                                                 */
/* ------------------------------------------------------------------ */

function getPublished(c: Context) {
  const card = store.get(c.req.param('id') ?? '');
  return card && card.published ? card : null;
}

app.get('/:id/vcard', (c) => {
  if (!assetLimit.hit(clientIp(c))) return c.text('rate limit', 429);
  const card = getPublished(c);
  if (!card) return c.text('not found', 404);
  const lang = pickLangParam(c, card.defaultLang);
  const { body, filename } = buildVcf(card, lang, `${baseUrl(c)}/${card.id}`);
  c.header('Content-Type', 'text/vcard; charset=utf-8');
  c.header('Content-Disposition', contentDisposition(filename));
  c.header('Cache-Control', 'no-store');
  return c.body(body);
});

app.get('/:id/qr.svg', async (c) => {
  if (!assetLimit.hit(clientIp(c))) return c.text('rate limit', 429);
  const card = getPublished(c);
  if (!card) return c.text('not found', 404);
  const svg = await qrSvg(qrTargetUrl(baseUrl(c), card.id));
  c.header('Content-Type', 'image/svg+xml');
  c.header('Cache-Control', 'public, max-age=86400');
  return c.body(svg);
});

app.get('/:id/qr.png', async (c) => {
  if (!assetLimit.hit(clientIp(c))) return c.text('rate limit', 429);
  const card = getPublished(c);
  if (!card) return c.text('not found', 404);
  const png = await qrPng(qrTargetUrl(baseUrl(c), card.id));
  c.header('Content-Type', 'image/png');
  c.header('Cache-Control', 'public, max-age=86400');
  return c.body(new Uint8Array(png));
});

app.get('/:id/edit', (c) => {
  const token = c.req.query('token') ?? '';
  const card = store.get(c.req.param('id'));
  if (!card || !token || !store.verifyToken(card.id, token)) {
    return c.html(notFoundPage('ar'), 404);
  }
  /* the page embeds the edit token; no cache anywhere may hold a copy */
  c.header('Cache-Control', 'no-store');
  return c.html(homePage({ ...(UMAMI ? { umami: UMAMI } : {}), edit: { card, token } }));
});

app.get('/:id', (c) => {
  const card = getPublished(c);
  if (!card) return c.html(notFoundPage('ar'), 404);
  const lang = pickLangParam(c, card.defaultLang);
  /* Read-heavy, changes rarely: cache 5 min at the edge. Stale
     copies self-heal within the TTL after an edit. */
  c.header('Cache-Control', 'public, s-maxage=300, max-age=60');
  return c.html(cardPage(card, lang, baseUrl(c), UMAMI));
});

app.notFound((c) => c.html(notFoundPage('ar'), 404));

if (process.env.NODE_ENV !== 'test') {
  serve({ fetch: app.fetch, port: PORT }, (info) => {
    console.log(`bitaqati listening on :${info.port} (db: ${DB_PATH})`);
  });
}

export default app;
