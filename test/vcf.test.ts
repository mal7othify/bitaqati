import test from 'node:test';
import assert from 'node:assert/strict';
import { buildVcf, vEscape } from '../src/vcf.js';
import { Card } from '../src/types.js';

const card: Card = {
  id: 'abc123xyz',
  nameAr: 'سارة, العتيبي',
  nameEn: 'Sara Alotaibi',
  titleEn: 'Engineer; Lead',
  companyEn: 'Acme',
  email: 'sara@example.com',
  links: { github: 'https://github.com/sara' },
  theme: 'rose',
  defaultLang: 'ar',
  avatarKind: 'initial',
  published: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

test('vCard 3.0 shape: CRLF lines, UTF-8 Arabic FN, no TEL', () => {
  const { body, filename } = buildVcf(card, 'ar', 'https://x.test/abc123xyz');
  assert.ok(body.startsWith('BEGIN:VCARD\r\nVERSION:3.0\r\n'));
  assert.match(body, /FN;CHARSET=UTF-8:سارة\\, العتيبي/);
  assert.ok(!/^TEL/m.test(body), 'no TEL field');
  assert.match(body, /NOTE;CHARSET=UTF-8:Name in English: Sara Alotaibi/);
  assert.match(body, /URL:https:\/\/github.com\/sara/);
  assert.ok(body.endsWith('END:VCARD\r\n'));
  assert.equal(filename, 'سارة, العتيبي.vcf');
});

test('one vcf per language: EN download carries Arabic name in NOTE', () => {
  const { body } = buildVcf(card, 'en', 'https://x.test/abc123xyz');
  assert.match(body, /FN;CHARSET=UTF-8:Sara Alotaibi/);
  assert.match(body, /TITLE;CHARSET=UTF-8:Engineer\\; Lead/);
  assert.match(body, /NOTE;CHARSET=UTF-8:الاسم بالعربي: سارة\\, العتيبي/);
});

test('vEscape covers backslash, comma, semicolon, newline', () => {
  assert.equal(vEscape('a\\b;c,d\ne'), 'a\\\\b\\;c\\,d\\ne');
});
