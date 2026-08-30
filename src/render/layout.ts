import { html, jsonIsland, Raw, raw } from '../html.js';
import { STRINGS } from '../i18n.js';
import { Lang, Theme } from '../types.js';

export interface LayoutOptions {
  lang: Lang;
  title: string;
  description?: string;
  theme?: Theme;
  /** Extra <head> markup (OG meta), already-safe Raw only. */
  head?: Raw;
  /** /js/*.js module scripts to load. */
  scripts?: string[];
  /** Umami analytics script origin+id, when configured. */
  umami?: { src: string; websiteId: string } | undefined;
  body: Raw;
}

const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='48' fill='%232e2e33'/%3E%3Ctext x='50' y='68' font-size='55' text-anchor='middle' fill='%23f5f5f7' font-family='sans-serif'%3E%D8%A8%3C/text%3E%3C/svg%3E";

/** Cloudflare Web Analytics: set CF_BEACON_TOKEN to inject the beacon.
    Complements the Umami option; either or both can be enabled. */
const CF_BEACON_TOKEN = process.env.CF_BEACON_TOKEN ?? '';

/** Google Analytics 4: set GA_MEASUREMENT_ID (G-XXXXXXXXXX) to enable.
    The CSP blocks inline scripts, so /js/ga.js does the gtag bootstrap. */
const GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID ?? '';

/** Cache-busting version for CSS/JS URLs. Assets carry a 1 h cache header,
    so without this a deploy could leave browsers on stale styles/scripts.
    A new value per server start is enough: assets only change on deploys. */
const ASSET_VERSION = Date.now().toString(36);
const versioned = (path: string): string => `${path}?v=${ASSET_VERSION}`;

export function layout(opts: LayoutOptions): string {
  const dir = opts.lang === 'ar' ? 'rtl' : 'ltr';
  const page = html`<!doctype html>
<html lang="${opts.lang}" dir="${dir}"${opts.theme ? raw(` data-palette="${opts.theme}"`) : ''}>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${opts.title}</title>
${opts.description ? html`<meta name="description" content="${opts.description}" />` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..700&family=Inter:wght@400..800&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="${versioned('/styles.css')}" />
<link rel="icon" href="${raw(FAVICON)}" />
${opts.head ?? ''}
${opts.umami ? html`<script defer src="${opts.umami.src}" data-website-id="${opts.umami.websiteId}"></script>` : ''}
${CF_BEACON_TOKEN ? html`<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon="${JSON.stringify({ token: CF_BEACON_TOKEN })}"></script>` : ''}
${GA_MEASUREMENT_ID ? html`<meta name="ga-measurement-id" content="${GA_MEASUREMENT_ID}" /><script type="module" src="${versioned('/js/ga.js')}"></script>` : ''}
${(opts.scripts ?? []).map((src) => html`<script type="module" src="${versioned(src)}"></script>`)}
</head>
<body>
<div class="aurora" aria-hidden="true"><span></span><span></span><span></span></div>
<script type="application/json" id="i18n-data">${jsonIsland(STRINGS)}</script>
${opts.body}
<footer class="gh-footer">
  <a href="https://github.com/mal7othify/bitaqati" target="_blank" rel="noopener noreferrer" data-i18n="contribute">${STRINGS.contribute[opts.lang]}</a>
</footer>
</body>
</html>`;
  return page.value;
}

export function topbar(lang: Lang, right?: Raw): Raw {
  const brand = STRINGS.brand[lang];
  return html`<header class="topbar container">
  <div class="topbar-inner glass">
    <a class="brand" href="/"><span class="brand-mark" aria-hidden="true">ب</span><span id="brand-name">${brand}</span></a>
    ${right ?? ''}
  </div>
</header>`;
}
