/* Card page: both language cards are server-rendered and stacked, so the
   only client behavior left is the report flow. Data comes from the JSON
   island the server rendered - no tokens, just the public card id. */

type Lang = 'ar' | 'en';

declare global {
  interface Window {
    umami?: { track: (event: string) => void };
  }
}

/* Strings come from src/i18n.ts via the JSON island the server embeds. */
const UI: Record<string, { ar: string; en: string }> = JSON.parse(
  document.getElementById('i18n-data')?.textContent ?? '{}'
) as Record<string, { ar: string; en: string }>;

const island = document.getElementById('card-data');
const data: { id: string } | null = island?.textContent ? (JSON.parse(island.textContent) as { id: string }) : null;

const reportBtn = document.getElementById('report-btn');

if (reportBtn?.hasAttribute('data-report-mail')) {
  /* mailto flow: the mail app opens via the href; also record the report
     silently so the operator sees it even if the email is never sent */
  reportBtn.addEventListener('click', () => {
    if (!data) return;
    void fetch(`/api/cards/${data.id}/report`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reason: '(email report opened)' }),
    }).catch(() => undefined);
  });
} else {
  reportBtn?.addEventListener('click', async () => {
    if (!data) return;
    const lang: Lang = document.documentElement.lang === 'en' ? 'en' : 'ar';
    const reason = prompt(UI.reportPrompt![lang]);
    if (reason === null) return;
    await fetch(`/api/cards/${data.id}/report`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reason }),
    }).catch(() => undefined);
    alert(UI.reportDone![lang]);
  });
}

export {};
