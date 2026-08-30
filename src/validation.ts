/* Server-side validation: length caps, https-only URLs,
   per-platform host checks, unknown fields rejected. */

import { AVATAR_KINDS, AvatarKind, CardInput, LANGS, Lang, LINK_PLATFORMS, LinkPlatform, THEMES, Theme } from './types.js';

const TEXT_LIMITS = {
  nameAr: 60, nameEn: 60,
  titleAr: 80, titleEn: 80,
  companyAr: 80, companyEn: 80,
  bioAr: 200, bioEn: 200,
} as const;
type TextField = keyof typeof TEXT_LIMITS;

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;

/** Hosts each platform link must live on. Mastodon is federated -
    any https host is allowed there. */
const PLATFORM_HOSTS: Record<LinkPlatform, string[] | null> = {
  github: ['github.com'],
  youtube: ['youtube.com', 'youtu.be'],
  x: ['x.com', 'twitter.com'],
  linkedin: ['linkedin.com'],
  bluesky: ['bsky.app'],
  mastodon: null,
  instagram: ['instagram.com'],
};

export type ValidationResult = { ok: true; card: CardInput } | { ok: false; errors: string[] };

function cleanText(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  if (!cleaned) return undefined;
  return cleaned.slice(0, max);
}

/** https-only; javascript:/data:/http:/anything else is rejected. */
export function safeHttpsUrl(value: string, allowedHosts: string[] | null): string | null {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    // Be forgiving about a missing scheme ("github.com/me") - but only by
    // upgrading to https, never any other scheme.
    try {
      url = new URL(`https://${value.trim()}`);
    } catch {
      return null;
    }
  }
  if (url.protocol !== 'https:') return null;
  if (url.username || url.password) return null;
  if (allowedHosts) {
    const host = url.hostname.toLowerCase();
    const match = allowedHosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
    if (!match) return null;
  }
  return url.href;
}

const KNOWN_FIELDS = new Set([
  ...Object.keys(TEXT_LIMITS), 'companyUrl', 'email', 'links', 'theme', 'defaultLang',
  'avatarKind', 'avatarEmoji',
]);

/** First grapheme cluster of the input, if it is pictographic (an emoji). */
export function cleanEmoji(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const stripped = value.replace(/[\u0000-\u001f\u007f\s]/gu, '');
  if (!stripped) return null;
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  const first = [...segmenter.segment(stripped)][0]?.segment ?? '';
  if (!first || !/\p{Extended_Pictographic}/u.test(first)) return null;
  return first;
}

export function validateCardInput(body: unknown): ValidationResult {
  const errors: string[] = [];
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, errors: ['body must be a JSON object'] };
  }
  const input = body as Record<string, unknown>;

  for (const key of Object.keys(input)) {
    if (!KNOWN_FIELDS.has(key)) errors.push(`unknown field: ${key}`);
  }

  const card: CardInput = { links: {}, theme: 'rose', defaultLang: 'ar', avatarKind: 'initial' };

  for (const field of Object.keys(TEXT_LIMITS) as TextField[]) {
    const value = cleanText(input[field], TEXT_LIMITS[field]);
    if (value !== undefined) card[field] = value;
  }

  if (!card.nameAr && !card.nameEn) errors.push('a name in Arabic or English is required');

  if (input.email !== undefined && input.email !== '') {
    const email = cleanText(input.email, 254);
    if (!email || !EMAIL_RE.test(email)) errors.push('invalid email');
    else card.email = email.toLowerCase();
  }

  if (input.companyUrl !== undefined && input.companyUrl !== '') {
    const url = typeof input.companyUrl === 'string' ? safeHttpsUrl(input.companyUrl, null) : null;
    if (!url) errors.push('company URL must be a valid https:// URL');
    else card.companyUrl = url;
  }

  const links = input.links;
  if (links !== undefined) {
    if (typeof links !== 'object' || links === null || Array.isArray(links)) {
      errors.push('links must be an object');
    } else {
      for (const [platform, value] of Object.entries(links)) {
        if (!(LINK_PLATFORMS as readonly string[]).includes(platform)) {
          errors.push(`unknown link platform: ${platform}`);
          continue;
        }
        if (value === undefined || value === '') continue;
        if (typeof value !== 'string') {
          errors.push(`${platform} link must be a string`);
          continue;
        }
        const url = safeHttpsUrl(value, PLATFORM_HOSTS[platform as LinkPlatform]);
        if (!url) errors.push(`${platform} link must be an https URL on the expected domain`);
        else card.links[platform as LinkPlatform] = url;
      }
    }
  }

  if (input.theme !== undefined) {
    if ((THEMES as readonly string[]).includes(input.theme as string)) card.theme = input.theme as Theme;
    else errors.push('unknown theme');
  }
  if (input.defaultLang !== undefined) {
    if ((LANGS as readonly string[]).includes(input.defaultLang as string)) card.defaultLang = input.defaultLang as Lang;
    else errors.push('defaultLang must be "ar" or "en"');
  }
  if (input.avatarKind !== undefined) {
    if ((AVATAR_KINDS as readonly string[]).includes(input.avatarKind as string)) card.avatarKind = input.avatarKind as AvatarKind;
    else errors.push('avatarKind must be "initial", "emoji" or "hidden"');
  }
  if (card.avatarKind === 'emoji') {
    const emoji = cleanEmoji(input.avatarEmoji);
    if (!emoji) errors.push('avatarEmoji must be a single emoji');
    else card.avatarEmoji = emoji;
  }
  // A default language with no content in it falls back to the filled one
  if (card.defaultLang === 'ar' && !card.nameAr) card.defaultLang = 'en';
  if (card.defaultLang === 'en' && !card.nameEn) card.defaultLang = 'ar';

  return errors.length ? { ok: false, errors } : { ok: true, card };
}
