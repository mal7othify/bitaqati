import { html, jsonIsland, Raw } from '../html.js';
import { STRINGS } from '../i18n.js';
import { Card, Lang, LinkPlatform, THEME_ACCENT } from '../types.js';
import { layout, topbar } from './layout.js';

const PLATFORM_LABELS: Record<LinkPlatform, string> = {
  github: 'GitHub',
  youtube: 'YouTube',
  x: 'X',
  linkedin: 'LinkedIn',
  bluesky: 'Bluesky',
  mastodon: 'Mastodon',
  instagram: 'Instagram',
};

export type UmamiConfig = { src: string; websiteId: string } | undefined;

export function initials(name: string, lang: Lang): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '؟';
  if (lang === 'ar') return [...(words[0] as string)][0] ?? '؟';
  return words
    .slice(0, 2)
    .map((w) => ([...w][0] ?? '').toUpperCase())
    .join('');
}

/** Cross-language fallback - used only for page metadata (title, OG tags),
    where some value is always needed. */
function pick(card: Card, lang: Lang, base: 'name' | 'title' | 'company' | 'bio'): string {
  const ar = card[`${base}Ar`];
  const en = card[`${base}En`];
  return (lang === 'ar' ? ar || en : en || ar) ?? '';
}

/** The visible cards are strict: each language's card shows only that
    language's text, exactly like the live preview on the create form. */
function own(card: Card, lang: Lang, base: 'name' | 'title' | 'company' | 'bio'): string {
  return card[`${base}${lang === 'ar' ? 'Ar' : 'En'}`] ?? '';
}

function avatar(card: Card, name: string, lang: Lang): Raw | '' {
  const kind = card.avatarKind ?? 'initial';
  if (kind === 'hidden') return '';
  const content = kind === 'emoji' ? card.avatarEmoji ?? '✨' : initials(name, lang);
  return html`<span class="avatar" aria-hidden="true">${content}</span>`;
}

/** One language's card. When both languages exist, the page stacks two of
    these - the default language first - instead of a toggle, so both sides
    of the bilingual card are visible at once. */
function cardArticle(card: Card, lang: Lang, primary: boolean): Raw {
  const name = own(card, lang, 'name');
  const title = own(card, lang, 'title');
  const company = own(card, lang, 'company');
  const bio = own(card, lang, 'bio');

  return html`<article class="vcard glass" lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
    ${avatar(card, name, lang)}
    ${primary
      ? html`<h1 class="gradient-text">${name}</h1>`
      : html`<p class="card-name gradient-text">${name}</p>`}
    ${title ? html`<p class="headline">${title}</p>` : ''}
    ${company
      ? card.companyUrl
        ? html`<a class="company-link" href="${card.companyUrl}" target="_blank" rel="noopener noreferrer">${company}</a>`
        : html`<p class="company-link">${company}</p>`
      : ''}
    ${bio ? html`<p class="bio">${bio}</p>` : ''}
    <ul class="links">
      ${card.email
        ? html`<li><a href="mailto:${card.email}" data-umami-event="click_email"><span>${STRINGS.lblEmail[lang]}</span><span class="arrow" aria-hidden="true">→</span></a></li>`
        : ''}
      ${Object.entries(card.links).map(
        ([platform, url]) =>
          html`<li><a href="${url}" target="_blank" rel="noopener noreferrer" data-umami-event="click_${platform}"><span>${PLATFORM_LABELS[platform as LinkPlatform]}</span><span class="arrow" aria-hidden="true">→</span></a></li>`
      )}
    </ul>
    <div class="card-actions">
      <a class="btn btn-gradient" href="/${card.id}/vcard?lang=${lang}" data-umami-event="save_contact">${STRINGS.saveContact[lang]}</a>
    </div>
  </article>`;
}

export function cardPage(card: Card, lang: Lang, baseUrl: string, umami?: UmamiConfig): string {
  const name = pick(card, lang, 'name');
  const title = pick(card, lang, 'title');
  const bio = pick(card, lang, 'bio');
  const cardUrl = `${baseUrl}/${card.id}`;

  /* Only languages the card actually has render, the requested (or default)
     language first and the other below it. */
  const other: Lang = lang === 'ar' ? 'en' : 'ar';
  const langs = ([lang, other] as Lang[]).filter((l) => card[l === 'ar' ? 'nameAr' : 'nameEn']);
  if (langs.length === 0) langs.push(lang); // unreachable: validation requires a name

  const head = html`<meta property="og:type" content="profile" />
<meta property="og:title" content="${name}${title ? ` - ${title}` : ''}" />
<meta property="og:description" content="${bio || title || STRINGS.ogFallback[lang]}" />
<meta property="og:url" content="${cardUrl}" />
<meta name="theme-color" content="${THEME_ACCENT[card.theme]}" />
<link rel="canonical" href="${cardUrl}" />`;

  const body = html`${topbar(lang)}
<main class="card-wrap">
  ${langs.map((l, i) => cardArticle(card, l, i === 0))}
</main>
<footer class="card-footer">
  <a href="/" id="footer-cta">${STRINGS.createOwn[lang]}</a>
  <button type="button" class="report-link" id="report-btn">${STRINGS.report[lang]}</button>
</footer>
<script type="application/json" id="card-data">${jsonIsland({ id: card.id })}</script>`;

  return layout({
    lang,
    title: `${name} · ${STRINGS.brand[lang]}`,
    ...(bio || title ? { description: bio || title } : {}),
    theme: card.theme,
    head,
    scripts: ['/js/card.js'],
    umami,
    body,
  });
}

export function notFoundPage(lang: Lang): string {
  const body = html`${topbar(lang)}
<main class="card-wrap">
  <div class="not-found glass">
    <h1 class="gradient-text">${STRINGS.nfTitle[lang]}</h1>
    <p>${STRINGS.nfSub[lang]}</p>
    <a class="btn btn-gradient" href="/">${STRINGS.nfCta[lang]}</a>
  </div>
</main>`;
  return layout({ lang, title: STRINGS.brand[lang], body });
}
