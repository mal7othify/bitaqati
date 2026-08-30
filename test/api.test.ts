import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';
process.env.BASE_URL = 'https://cards.test';
process.env.ADMIN_TOKEN = 'test-admin-token';

const { default: app } = await import('../src/server.js');

const jsonReq = (method: string, path: string, body?: unknown, ip = '10.0.0.1') =>
  app.request(path, {
    method,
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

let cardId = '';
let editToken = '';

test('create card returns short id + edit url', async () => {
  const res = await jsonReq('POST', '/api/cards', {
    nameAr: 'سارة العتيبي',
    nameEn: 'Sara Alotaibi',
    titleEn: 'Engineer',
    companyEn: 'Acme',
    companyUrl: 'https://acme.example',
    email: 'sara@example.com',
    links: { github: 'https://github.com/sara' },
    theme: 'mint',
    defaultLang: 'ar',
  });
  assert.equal(res.status, 201);
  const body = (await res.json()) as { id: string; url: string; editUrl: string; editToken: string };
  assert.match(body.id, /^[2-9a-zA-Z]{9}$/);
  assert.equal(body.url, `https://cards.test/${body.id}`);
  cardId = body.id;
  editToken = body.editToken;
});

test('card page renders SSR with dir=rtl, OG meta, CSP and cache headers', async () => {
  const res = await app.request(`/${cardId}`, { headers: { 'x-forwarded-for': '10.0.0.2' } });
  assert.equal(res.status, 200);
  assert.match(res.headers.get('cache-control') ?? '', /s-maxage=300/);
  assert.match(res.headers.get('content-security-policy') ?? '', /script-src 'self'/);
  const htmlBody = await res.text();
  assert.match(htmlBody, /dir="rtl"/);
  assert.match(htmlBody, /سارة العتيبي/);
  assert.match(htmlBody, /og:title/);
  assert.match(htmlBody, /data-palette="mint"/);
  assert.match(htmlBody, /href="https:\/\/acme.example\/"[^>]*rel="noopener noreferrer"/);
});

test('?lang=en flips direction and language', async () => {
  const res = await app.request(`/${cardId}?lang=en`, { headers: { 'x-forwarded-for': '10.0.0.2' } });
  const htmlBody = await res.text();
  assert.match(htmlBody, /dir="ltr"/);
  assert.match(htmlBody, /Sara Alotaibi/);
});

test('XSS: injected HTML in name renders escaped', async () => {
  const res = await jsonReq('POST', '/api/cards', {
    nameEn: '<script>alert(1)</script>',
    bioEn: '"><img src=x onerror=alert(2)>',
  });
  assert.equal(res.status, 201);
  const { id } = (await res.json()) as { id: string };
  const page = await (await app.request(`/${id}`, { headers: { 'x-forwarded-for': '10.0.0.3' } })).text();
  assert.ok(!page.includes('<script>alert(1)'), 'script tag must be escaped');
  assert.ok(!page.includes('<img src=x'), 'img injection must be escaped');
  assert.match(page, /&lt;script&gt;/);
});

test('vcard endpoint: correct headers, Arabic intact, no TEL', async () => {
  const res = await app.request(`/${cardId}/vcard?lang=ar`, { headers: { 'x-forwarded-for': '10.0.0.4' } });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'text/vcard; charset=utf-8');
  assert.match(res.headers.get('content-disposition') ?? '', /attachment; filename=/);
  const vcf = await res.text();
  assert.match(vcf, /سارة العتيبي/);
  assert.ok(!/^TEL/m.test(vcf));
});

test('QR endpoints serve SVG and PNG encoding ?src=qr', async () => {
  const svgRes = await app.request(`/${cardId}/qr.svg`, { headers: { 'x-forwarded-for': '10.0.0.5' } });
  assert.equal(svgRes.status, 200);
  assert.equal(svgRes.headers.get('content-type'), 'image/svg+xml');
  assert.match(await svgRes.text(), /<svg/);

  const pngRes = await app.request(`/${cardId}/qr.png`, { headers: { 'x-forwarded-for': '10.0.0.5' } });
  assert.equal(pngRes.status, 200);
  assert.equal(pngRes.headers.get('content-type'), 'image/png');
  const bytes = new Uint8Array(await pngRes.arrayBuffer());
  assert.equal(bytes[0], 0x89, 'PNG magic byte');
});

test('editing requires the token', async () => {
  const wrong = await jsonReq('PUT', `/api/cards/${cardId}`, { nameEn: 'Hacked', editToken: 'nope' });
  assert.equal(wrong.status, 403);

  const right = await jsonReq('PUT', `/api/cards/${cardId}`, { nameEn: 'Sara A.', nameAr: 'سارة', editToken });
  assert.equal(right.status, 200);

  const editPage = await app.request(`/${cardId}/edit?token=${editToken}`, { headers: { 'x-forwarded-for': '10.0.0.6' } });
  assert.equal(editPage.status, 200);
  const badEditPage = await app.request(`/${cardId}/edit?token=bad`, { headers: { 'x-forwarded-for': '10.0.0.6' } });
  assert.equal(badEditPage.status, 404);
});

test('report + admin unpublish flow', async () => {
  const report = await jsonReq('POST', `/api/cards/${cardId}/report`, { reason: 'test report' });
  assert.equal(report.status, 200);

  const noAuth = await jsonReq('POST', `/api/admin/cards/${cardId}/unpublish`);
  assert.equal(noAuth.status, 403);

  const res = await app.request(`/api/admin/cards/${cardId}/unpublish`, {
    method: 'POST',
    headers: { authorization: 'Bearer test-admin-token', 'x-forwarded-for': '10.0.0.7' },
  });
  assert.equal(res.status, 200);

  const page = await app.request(`/${cardId}`, { headers: { 'x-forwarded-for': '10.0.0.7' } });
  assert.equal(page.status, 404);
});

test('rate limit: 11th creation from one IP is rejected', async () => {
  const ip = '10.9.9.9';
  for (let i = 0; i < 10; i++) {
    const res = await jsonReq('POST', '/api/cards', { nameEn: `Person ${i}` }, ip);
    assert.equal(res.status, 201, `creation ${i + 1} allowed`);
  }
  const blocked = await jsonReq('POST', '/api/cards', { nameEn: 'Person 11' }, ip);
  assert.equal(blocked.status, 429);
});

test('unknown card id → 404 page', async () => {
  const res = await app.request('/zzzzzzzzz', { headers: { 'x-forwarded-for': '10.0.0.8' } });
  assert.equal(res.status, 404);
});
