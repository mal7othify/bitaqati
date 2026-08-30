# بطاقتي · Bitaqati

Bilingual (Arabic/English) digital business cards with short URLs, QR codes,
and one-tap vCard download.

**Stack**: TypeScript everywhere · Hono on Node 24 (server-rendered pages,
no SPA) · SQLite via the built-in `node:sqlite` (WAL, zero native deps) ·
`nanoid` short IDs · `qrcode` for SVG/PNG QR · Docker + Caddy (auto-HTTPS).

## Layout

```
src/            server (Hono routes, db, validation, vcf, qr, rate limits)
src/render/     server-rendered pages (escaping-by-default html templating)
client/         browser TypeScript (compiled to public/js/)
public/         styles.css + compiled client js
test/           node:test suite (validation, vcf, full API)
Dockerfile, docker-compose.yml, Caddyfile, scripts/backup.sh
```

## Run locally

Requires Node ≥ 24 (uses the built-in `node:sqlite`).

```bash
npm install
npm run dev
npm test
```

## Deploy

```bash
cp .env.example .env
docker compose up -d --build
```

Caddy terminates TLS with automatic certificates for `DOMAIN`. Monitor
`GET /healthz`; back up the SQLite database with `scripts/backup.sh`.

## API surface

| Route                                 | What                                                  |
| ------------------------------------- | ----------------------------------------------------- |
| `GET /`                               | landing: create form + live preview (AR/EN UI toggle) |
| `POST /api/cards`                     | create → `{id, url, editUrl, editToken}` (10/hour/IP) |
| `GET /:id`                            | card page (SSR, RTL/LTR, OG meta, cacheable)          |
| `GET /:id?lang=en`                    | orders that language's card first                     |
| `GET /:id/vcard?lang=`                | vCard 3.0 UTF-8 download, per language, no TEL        |
| `GET /:id/qr.svg` · `/:id/qr.png`     | QR (EC level M, encodes `?src=qr`)                    |
| `GET /:id/edit?token=`                | edit form (secret edit link)                          |
| `PUT /api/cards/:id`                  | update (requires `editToken`)                         |
| `POST /api/cards/:id/report`          | abuse report                                          |
| `POST /api/admin/cards/:id/unpublish` | admin, `Authorization: Bearer $ADMIN_TOKEN`           |
| `GET /healthz`                        | liveness                                              |

## Analytics

Two zero-cookie options, independently toggled by env vars; leave both empty
to run with no analytics at all.

- **Cloudflare Web Analytics** (if the site runs behind Cloudflare): create
  a site in the Cloudflare dashboard under Analytics -> Web Analytics, copy
  the beacon token into `CF_BEACON_TOKEN`, and the beacon is injected on
  every page with a matching CSP entry. No backend to run.
- **Umami**: set `UMAMI_SRC` + `UMAMI_WEBSITE_ID` and the snippet is injected
  on every page. Custom events fire via `data-umami-event`: `save_contact`,
  `click_email`, `click_<platform>`, `card_created`, `card_edited`. QR scans
  are segmentable by the `?src=qr` query in pageviews. (Umami is
  self-hostable; it is intentionally not part of this compose file.)

## Localization

Every user-facing string (Arabic and English) lives in `src/i18n.ts` only.
The server renders from that table and embeds it as a JSON island
(`#i18n-data`) in each page for the browser scripts, so translating or
rewording means editing that one file and rebuilding.
