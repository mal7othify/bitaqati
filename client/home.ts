/* Landing page: UI language toggle, per-language sections, avatar picker,
   dual live preview (Arabic card, then English), client-side validation
   with specific messages, and create/edit submission. */

type Lang = 'ar' | 'en';
type Theme = 'rose' | 'lavender' | 'mint' | 'peach' | 'sky' | 'black' | 'gray';
type AvatarKind = 'initial' | 'emoji' | 'hidden';

/** Suggested logo emoji per palette - used as the emoji placeholder and as
    the actual logo when the emoji field is left empty. */
const THEME_EMOJI: Record<Theme, string> = {
  rose: '🌸', lavender: '💜', mint: '🌿', peach: '🧡', sky: '☁️',
  black: '💻', gray: '🩶',
};

const PLATFORMS = ['github', 'youtube', 'x', 'linkedin', 'bluesky', 'mastodon', 'instagram'] as const;
type Platform = (typeof PLATFORMS)[number];

const PLATFORM_LABELS: Record<Platform, string> = {
  github: 'GitHub', youtube: 'YouTube', x: 'X', linkedin: 'LinkedIn',
  bluesky: 'Bluesky', mastodon: 'Mastodon', instagram: 'Instagram',
};

/* Mirrors the server rules (validation.ts) so errors are caught before
   submitting, with friendly localized messages. */
const PLATFORM_HOSTS: Record<Platform, string[] | null> = {
  github: ['github.com'],
  youtube: ['youtube.com', 'youtu.be'],
  x: ['x.com', 'twitter.com'],
  linkedin: ['linkedin.com'],
  bluesky: ['bsky.app'],
  mastodon: null,
  instagram: ['instagram.com'],
};

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;

/* Every AR/EN string comes from src/i18n.ts, embedded by the server as a
   JSON island (#i18n-data) in the page - one file to translate. */
type LocaleEntry = { ar: string; en: string };
const T: Record<string, LocaleEntry> = JSON.parse(
  document.getElementById('i18n-data')?.textContent ?? '{}'
) as Record<string, LocaleEntry>;

interface EditIsland {
  id: string;
  token: string;
  card: {
    nameAr?: string; nameEn?: string; titleAr?: string; titleEn?: string;
    companyAr?: string; companyEn?: string; companyUrl?: string;
    bioAr?: string; bioEn?: string; email?: string;
    links: Partial<Record<Platform, string>>;
    theme: Theme; defaultLang: Lang;
    avatarKind?: AvatarKind; avatarEmoji?: string;
  };
}

declare global {
  interface Window {
    umami?: { track: (event: string) => void };
  }
}

const form = document.getElementById('card-form') as HTMLFormElement;
const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
const errorEl = document.getElementById('form-error') as HTMLElement;
const editIslandEl = document.getElementById('edit-data');
const editing: EditIsland | null = editIslandEl?.textContent ? (JSON.parse(editIslandEl.textContent) as EditIsland) : null;

let uiLang: Lang = (localStorage.getItem('bitaqati:uiLang') as Lang | null) ?? 'ar';
let theme: Theme = 'rose';
let avatarKind: AvatarKind = 'initial';

const field = (name: string): HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement =>
  form.elements.namedItem(name) as HTMLInputElement;

const sectionToggle = (lang: Lang): HTMLInputElement => document.getElementById(`enable-${lang}`) as HTMLInputElement;
const sectionOn = (lang: Lang): boolean => sectionToggle(lang).checked;

function setUiLang(lang: Lang): void {
  uiLang = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const entry = T[el.dataset.i18n ?? ''];
    if (entry) el.textContent = entry[lang];
  });
  document.querySelectorAll<HTMLButtonElement>('[data-lang-btn]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.langBtn === lang));
  });
  document.getElementById('brand-name')!.textContent = T.brand![lang];
  try {
    localStorage.setItem('bitaqati:uiLang', lang);
  } catch { /* storage unavailable */ }
  renderPreview();
}

document.querySelectorAll<HTMLButtonElement>('[data-lang-btn]').forEach((btn) => {
  btn.addEventListener('click', () => setUiLang(btn.dataset.langBtn as Lang));
});

const suggestedEmoji = (): string => THEME_EMOJI[theme];

/* Palette picker: live-applies to the whole page; the suggested logo emoji
   follows the chosen color */
function setTheme(next: Theme): void {
  theme = next;
  document.documentElement.dataset.palette = next;
  document.querySelectorAll<HTMLButtonElement>('.palette-chip').forEach((chip) => {
    chip.setAttribute('aria-pressed', String(chip.dataset.palette === next));
  });
  (field('avatarEmoji') as HTMLInputElement).placeholder = suggestedEmoji();
  renderPreview();
}

document.querySelectorAll<HTMLButtonElement>('.palette-chip').forEach((chip) => {
  chip.addEventListener('click', () => setTheme(chip.dataset.palette as Theme));
});

/* Avatar picker: first letter (default) / emoji of choice / none */
function setAvatarKind(next: AvatarKind): void {
  avatarKind = next;
  document.querySelectorAll<HTMLButtonElement>('[data-avatar-kind]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.avatarKind === next));
  });
  document.getElementById('emoji-field')!.hidden = next !== 'emoji';
  renderPreview();
}

document.querySelectorAll<HTMLButtonElement>('[data-avatar-kind]').forEach((btn) => {
  btn.addEventListener('click', () => setAvatarKind(btn.dataset.avatarKind as AvatarKind));
});

/* The logo is one emoji: clamp whatever is typed or pasted to the first
   grapheme cluster (an emoji with skin tone or ZWJ parts stays whole). */
field('avatarEmoji').addEventListener('input', () => {
  const input = field('avatarEmoji') as HTMLInputElement;
  const clamped = firstGrapheme(input.value.replace(/\s/gu, ''));
  if (input.value !== clamped) input.value = clamped;
});

/* Language sections: each can be turned off, but never both */
function setSection(lang: Lang, on: boolean): void {
  sectionToggle(lang).checked = on;
  document.getElementById(`fields-${lang}`)!.hidden = !on;
  const defaultLang = field('defaultLang') as HTMLSelectElement;
  if (!on && defaultLang.value === lang) defaultLang.value = lang === 'ar' ? 'en' : 'ar';
  renderPreview();
}

(['ar', 'en'] as const).forEach((lang) => {
  sectionToggle(lang).addEventListener('change', () => {
    const other: Lang = lang === 'ar' ? 'en' : 'ar';
    if (!sectionToggle(lang).checked && !sectionOn(other)) {
      sectionToggle(lang).checked = true; // at least one language stays on
      showError(T.errOneLang![uiLang]);
      renderPreview(); // the form input event rendered the unchecked state; render the restored one
      return;
    }
    errorEl.hidden = true;
    setSection(lang, sectionToggle(lang).checked);
  });
});

/* ------------------------------------------------------------------ */
/* Live preview: Arabic card first, English card below it              */
/* ------------------------------------------------------------------ */

function firstGrapheme(value: string): string {
  try {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    return [...segmenter.segment(value)][0]?.segment ?? '';
  } catch {
    return [...value][0] ?? '';
  }
}

function initials(name: string, lang: Lang): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return lang === 'ar' ? '؟' : '?';
  if (lang === 'ar') return firstGrapheme(words[0]!);
  return words.slice(0, 2).map((w) => firstGrapheme(w).toUpperCase()).join('');
}

/** Each preview card shows only its own language's text, exactly like the
    published page - the English card stays empty until English is typed. */
function pick(lang: Lang, base: 'name' | 'title' | 'company' | 'bio'): string {
  return field(`${base}${lang === 'ar' ? 'Ar' : 'En'}`).value.trim();
}

function renderPreviewCard(lang: Lang): void {
  const block = document.getElementById(`pv-block-${lang}`)!;
  block.hidden = !sectionOn(lang);
  if (block.hidden) return;

  const name = pick(lang, 'name') || T.pvYourName![lang];

  const avatarEl = document.getElementById(`pv-avatar-${lang}`)!;
  avatarEl.hidden = avatarKind === 'hidden';
  avatarEl.textContent =
    avatarKind === 'emoji' ? field('avatarEmoji').value.trim() || suggestedEmoji() : initials(name, lang);

  document.getElementById(`pv-name-${lang}`)!.textContent = name;

  const set = (id: string, value: string): void => {
    const el = document.getElementById(id)!;
    el.textContent = value;
    el.hidden = !value;
  };
  set(`pv-title-${lang}`, pick(lang, 'title'));
  set(`pv-company-${lang}`, pick(lang, 'company'));
  set(`pv-bio-${lang}`, pick(lang, 'bio'));

  const links = document.getElementById(`pv-links-${lang}`)!;
  links.replaceChildren();
  const addPill = (label: string): void => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    const text = document.createElement('span');
    text.textContent = label;
    const arrow = document.createElement('span');
    arrow.className = 'arrow';
    arrow.textContent = '→';
    a.append(text, arrow);
    li.append(a);
    links.append(li);
  };
  if (field('email').value.trim()) addPill(T.lblEmail![lang]);
  for (const p of PLATFORMS) {
    if (field(`link-${p}`).value.trim()) addPill(PLATFORM_LABELS[p]);
  }
}

function renderPreview(): void {
  renderPreviewCard('ar');
  renderPreviewCard('en');
}

form.addEventListener('input', (e) => {
  (e.target as HTMLElement).closest('.field')?.classList.remove('invalid');
  renderPreview();
});
field('defaultLang').addEventListener('change', renderPreview);

/* ------------------------------------------------------------------ */
/* Prefill when editing                                                */
/* ------------------------------------------------------------------ */

if (editing) {
  const card = editing.card;
  for (const key of ['nameAr', 'nameEn', 'titleAr', 'titleEn', 'companyAr', 'companyEn', 'companyUrl', 'bioAr', 'bioEn', 'email', 'avatarEmoji'] as const) {
    const value = card[key];
    if (typeof value === 'string') field(key).value = value;
  }
  for (const p of PLATFORMS) {
    const value = card.links?.[p];
    if (value) field(`link-${p}`).value = value;
  }
  field('defaultLang').value = card.defaultLang ?? 'ar';
  setTheme(card.theme ?? 'rose');
  setAvatarKind(card.avatarKind ?? 'initial');
  const hasAr = Boolean(card.nameAr || card.titleAr || card.companyAr || card.bioAr);
  const hasEn = Boolean(card.nameEn || card.titleEn || card.companyEn || card.bioEn);
  if (hasAr || hasEn) {
    setSection('ar', hasAr);
    setSection('en', hasEn);
  }
}

/* ------------------------------------------------------------------ */
/* Validation + submit                                                 */
/* ------------------------------------------------------------------ */

function markInvalid(name: string): void {
  field(name)?.closest('.field')?.classList.add('invalid');
}

/** Runs the server's rules locally so the user sees exactly what to fix,
    in their language, before anything is sent. */
function validateForm(): string[] {
  const errors: string[] = [];

  const nameAr = sectionOn('ar') ? field('nameAr').value.trim() : '';
  const nameEn = sectionOn('en') ? field('nameEn').value.trim() : '';
  if (!nameAr && !nameEn) {
    errors.push(T.errName![uiLang]);
    if (sectionOn('ar')) markInvalid('nameAr');
    if (sectionOn('en')) markInvalid('nameEn');
  }

  const email = field('email').value.trim();
  if (email && !EMAIL_RE.test(email)) {
    errors.push(T.errEmail![uiLang]);
    markInvalid('email');
  }

  const companyUrl = field('companyUrl').value.trim();
  if (companyUrl && !safeHttpsUrl(companyUrl, null)) {
    errors.push(T.errCompanyUrl![uiLang]);
    markInvalid('companyUrl');
  }

  for (const p of PLATFORMS) {
    const value = field(`link-${p}`).value.trim();
    if (value && !safeHttpsUrl(value, PLATFORM_HOSTS[p])) {
      errors.push(T.errLink![uiLang].replace('{p}', PLATFORM_LABELS[p]));
      markInvalid(`link-${p}`);
    }
  }

  if (avatarKind === 'emoji') {
    // empty means the palette's suggested emoji (the placeholder) is used
    const emoji = field('avatarEmoji').value.trim();
    if (emoji && !/\p{Extended_Pictographic}/u.test(firstGrapheme(emoji))) {
      errors.push(T.errEmoji![uiLang]);
      markInvalid('avatarEmoji');
    }
  }

  /* Mirror of the server rule: a name alone is not a card */
  const inSection = (name: string, lang: Lang): string => (sectionOn(lang) ? field(name).value.trim() : '');
  const hasTitle = Boolean(inSection('titleAr', 'ar') || inSection('titleEn', 'en'));
  const hasCompany = Boolean((inSection('companyAr', 'ar') || inSection('companyEn', 'en')) && companyUrl);
  const hasLinks = Boolean(email) || PLATFORMS.some((p) => field(`link-${p}`).value.trim());
  if ((nameAr || nameEn) && !hasTitle && !hasCompany && !hasLinks) {
    errors.push(T.errCardEmpty![uiLang]);
    if (sectionOn('ar')) markInvalid('titleAr');
    if (sectionOn('en')) markInvalid('titleEn');
  }

  return errors;
}

function safeHttpsUrl(value: string, allowedHosts: string[] | null): boolean {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    try {
      url = new URL(`https://${value.trim()}`);
    } catch {
      return false;
    }
  }
  if (url.protocol !== 'https:' || url.username || url.password) return false;
  if (!/\.[a-z0-9-]{2,}$/i.test(url.hostname)) return false;
  if (allowedHosts) {
    const host = url.hostname.toLowerCase();
    if (!allowedHosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))) return false;
  }
  return true;
}

function collect(): Record<string, unknown> {
  const links: Partial<Record<Platform, string>> = {};
  for (const p of PLATFORMS) {
    const value = field(`link-${p}`).value.trim();
    if (value) links[p] = value;
  }
  let defaultLang = field('defaultLang').value as Lang;
  if (!sectionOn(defaultLang)) defaultLang = defaultLang === 'ar' ? 'en' : 'ar';
  const out: Record<string, unknown> = { links, theme, defaultLang, avatarKind };
  if (avatarKind === 'emoji') out.avatarEmoji = field('avatarEmoji').value.trim() || suggestedEmoji();
  for (const key of ['companyUrl', 'email'] as const) {
    const value = field(key).value.trim();
    if (value) out[key] = value;
  }
  for (const lang of ['ar', 'en'] as const) {
    if (!sectionOn(lang)) continue; // a switched-off section is left out entirely
    const suffix = lang === 'ar' ? 'Ar' : 'En';
    for (const base of ['name', 'title', 'company', 'bio'] as const) {
      const value = field(`${base}${suffix}`).value.trim();
      if (value) out[`${base}${suffix}`] = value;
    }
  }
  return out;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.hidden = true;
  form.querySelectorAll('.field.invalid').forEach((el) => el.classList.remove('invalid'));

  const problems = validateForm();
  if (problems.length) {
    showError(problems.join('\n'));
    form.querySelector<HTMLElement>('.field.invalid input, .field.invalid textarea')?.focus();
    return;
  }

  submitBtn.disabled = true;
  try {
    const payload = collect();
    const res = editing
      ? await fetch(`/api/cards/${editing.id}`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ ...payload, editToken: editing.token }),
        })
      : await fetch('/api/cards', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });

    if (res.status === 429) return showError(T.errRate![uiLang]);
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { errors?: string[] } | null;
      return showError(body?.errors?.map(localizeServerError).join('\n') || T.errGeneric![uiLang]);
    }

    let id: string;
    let editUrl: string | undefined;
    if (editing) {
      id = editing.id;
      editUrl = undefined; // already known to the owner; show "saved" instead
    } else {
      const body = (await res.json()) as { id: string; editUrl: string };
      id = body.id;
      editUrl = body.editUrl;
    }
    showSuccess(id, `${location.origin}/${id}`, editUrl);
    if (!editing) saveLastCard(id, `${location.origin}/${id}`, editUrl);
    window.umami?.track(editing ? 'card_edited' : 'card_created');
  } catch {
    showError(T.errGeneric![uiLang]);
  } finally {
    submitBtn.disabled = false;
  }
});

/** Server messages arrive in English; translate the known ones. */
function localizeServerError(message: string): string {
  if (message.includes('name in Arabic or English')) return T.errName![uiLang];
  if (message.includes('add a title')) return T.errCardEmpty![uiLang];
  if (message.includes('invalid email')) return T.errEmail![uiLang];
  if (message.includes('company URL')) return T.errCompanyUrl![uiLang];
  if (message.includes('avatarEmoji')) return T.errEmoji![uiLang];
  const link = message.match(/^(\w+) link/);
  if (link) return T.errLink![uiLang].replace('{p}', PLATFORM_LABELS[link[1] as Platform] ?? link[1]!);
  return message;
}

function showError(message: string): void {
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function showSuccess(id: string, url: string, editUrl?: string): void {
  (document.getElementById('success-link') as HTMLAnchorElement).textContent = url.replace(/^https?:\/\//, '');
  (document.getElementById('success-link') as HTMLAnchorElement).href = url;
  (document.getElementById('success-open') as HTMLAnchorElement).href = url;
  (document.getElementById('success-qr') as HTMLImageElement).src = `/${id}/qr.svg`;
  (document.getElementById('qr-svg') as HTMLAnchorElement).href = `/${id}/qr.svg`;
  (document.getElementById('qr-png') as HTMLAnchorElement).href = `/${id}/qr.png`;
  const editBox = document.getElementById('edit-url')!;
  const note = document.querySelector<HTMLElement>('[data-i18n="successEditNote"]');
  if (editUrl) {
    editBox.textContent = editUrl;
    editBox.hidden = false;
  } else {
    editBox.hidden = true;
    if (note) note.textContent = T.successSaved![uiLang];
    document.getElementById('success-copy-edit')!.hidden = true;
  }
  form.hidden = true;
  document.querySelector<HTMLElement>('.preview-pane')!.hidden = true;
  const success = document.getElementById('success')!;
  success.hidden = false;
  success.scrollIntoView({ behavior: 'smooth', block: 'center' });

  document.getElementById('success-copy')?.addEventListener('click', async (ev) => {
    await navigator.clipboard.writeText(url);
    (ev.target as HTMLElement).textContent = T.copied![uiLang];
  });
  document.getElementById('success-copy-edit')?.addEventListener('click', async (ev) => {
    if (editUrl) await navigator.clipboard.writeText(editUrl);
    (ev.target as HTMLElement).textContent = T.copied![uiLang];
  });
}

/* ------------------------------------------------------------------ */
/* Same-session restore: coming back to the home page after creating a */
/* card shows the success panel (links + QR) again instead of a blank  */
/* form. sessionStorage is per-tab and same-origin, and is cleared     */
/* when the tab closes - the edit link never outlives the session or   */
/* leaves this browser.                                                */
/* ------------------------------------------------------------------ */

const LAST_CARD_KEY = 'bitaqati:lastCard';

function saveLastCard(id: string, url: string, editUrl?: string): void {
  try {
    sessionStorage.setItem(LAST_CARD_KEY, JSON.stringify({ id, url, editUrl }));
  } catch { /* storage unavailable */ }
}

document.getElementById('success-new')?.addEventListener('click', () => {
  try {
    sessionStorage.removeItem(LAST_CARD_KEY);
  } catch { /* storage unavailable */ }
  document.getElementById('success')!.hidden = true;
  form.hidden = false;
  document.querySelector<HTMLElement>('.preview-pane')!.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

setUiLang(uiLang);
renderPreview();

if (!editing) {
  try {
    const stored = sessionStorage.getItem(LAST_CARD_KEY);
    if (stored) {
      const last = JSON.parse(stored) as { id?: string; url?: string; editUrl?: string };
      if (last.id && last.url && new URL(last.url).origin === location.origin) {
        showSuccess(last.id, last.url, last.editUrl);
      }
    }
  } catch { /* unreadable storage: start fresh */ }
}

export {};
