/* vCard 3.0 generation: UTF-8, one .vcf per language, the
   other-language name in NOTE, no TEL. */

import { STRINGS } from './i18n.js';
import { Card, Lang } from './types.js';

/** RFC 6350/2426 text escaping: backslash, comma, semicolon, newline. */
export function vEscape(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

const pickLang = (card: Card, lang: Lang, base: 'name' | 'title' | 'company' | 'bio'): string | undefined => {
  const ar = card[`${base}Ar`];
  const en = card[`${base}En`];
  return lang === 'ar' ? ar || en : en || ar;
};

export function buildVcf(card: Card, lang: Lang, cardUrl: string): { body: string; filename: string } {
  const name = pickLang(card, lang, 'name') ?? card.id;
  const otherName = lang === 'ar' ? card.nameEn : card.nameAr;
  const title = pickLang(card, lang, 'title');
  const company = pickLang(card, lang, 'company');
  const bio = pickLang(card, lang, 'bio');

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN;CHARSET=UTF-8:${vEscape(name)}`,
    // N: put the whole display name in the family slot - splitting Arabic
    // names heuristically corrupts them more often than it helps.
    `N;CHARSET=UTF-8:${vEscape(name)};;;;`,
  ];
  if (title) lines.push(`TITLE;CHARSET=UTF-8:${vEscape(title)}`);
  if (company) lines.push(`ORG;CHARSET=UTF-8:${vEscape(company)}`);
  if (card.email) lines.push(`EMAIL;TYPE=INTERNET:${vEscape(card.email)}`);
  if (card.companyUrl) lines.push(`URL:${vEscape(card.companyUrl)}`);
  for (const url of Object.values(card.links)) lines.push(`URL:${vEscape(url)}`);
  lines.push(`URL:${vEscape(cardUrl)}`);

  const notes: string[] = [];
  if (otherName) notes.push(`${STRINGS.vcfNameNote[lang]}: ${otherName}`);
  if (bio) notes.push(bio);
  if (notes.length) lines.push(`NOTE;CHARSET=UTF-8:${vEscape(notes.join('\n'))}`);

  lines.push(`REV:${new Date().toISOString()}`, 'END:VCARD');

  return { body: lines.join('\r\n') + '\r\n', filename: `${name}.vcf` };
}

/** Content-Disposition with a safe ASCII fallback and RFC 5987 UTF-8 name
    (Arabic filenames survive on modern browsers, ASCII everywhere else). */
export function contentDisposition(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  const encoded = encodeURIComponent(filename).replace(/['()*]/g, (c) => '%' + c.charCodeAt(0).toString(16));
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}
