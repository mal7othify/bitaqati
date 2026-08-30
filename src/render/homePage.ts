import { html, jsonIsland, raw, Raw } from '../html.js';
import { STRINGS, StringKey, t } from '../i18n.js';
import { Card, Lang, LINK_PLATFORMS, THEMES } from '../types.js';
import { layout, topbar } from './layout.js';
import { UmamiConfig } from './cardPage.js';

const LINK_PLACEHOLDERS: Record<string, string> = {
  github: 'https://github.com/username',
  youtube: 'https://youtube.com/@channel',
  x: 'https://x.com/username',
  linkedin: 'https://linkedin.com/in/username',
  bluesky: 'https://bsky.app/profile/handle',
  mastodon: 'https://mastodon.social/@username',
  instagram: 'https://instagram.com/username',
};

export interface HomePageOptions {
  umami?: UmamiConfig;
  /** Present when rendering the edit form (token already verified). */
  edit?: { card: Card; token: string };
}

/** One language section: a legend checkbox turns the whole section on/off
    (at least one language must stay on - home.js enforces it). */
function langFieldset(lang: Lang): Raw {
  const suffix = lang === 'ar' ? 'Ar' : 'En';
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  /* Arabic-section labels use the base keys, English-section the "2" keys */
  const key = (base: string): StringKey => `${base}${lang === 'ar' ? '' : '2'}` as StringKey;

  return html`<fieldset>
    <legend>
      <label class="legend-toggle">
        <input type="checkbox" id="enable-${lang}" checked />
        <span data-i18n="${lang === 'ar' ? 'fsAr' : 'fsEn'}">${t(lang === 'ar' ? 'fsAr' : 'fsEn')}</span>
      </label>
    </legend>
    <div class="fieldset-body" id="fields-${lang}">
      <div class="field">
        <label for="name${suffix}" data-i18n="${key('lblName')}">${t(key('lblName'))}</label>
        <input id="name${suffix}" name="name${suffix}" maxlength="60" dir="${dir}" placeholder="${STRINGS.phName[lang]}" />
      </div>
      <div class="field">
        <label for="title${suffix}" data-i18n="${key('lblTitle')}">${t(key('lblTitle'))}</label>
        <input id="title${suffix}" name="title${suffix}" maxlength="80" dir="${dir}" placeholder="${STRINGS.phTitle[lang]}" />
      </div>
      <div class="field">
        <label for="company${suffix}" data-i18n="${key('lblCompany')}">${t(key('lblCompany'))}</label>
        <input id="company${suffix}" name="company${suffix}" maxlength="80" dir="${dir}" />
      </div>
      <div class="field">
        <label for="bio${suffix}" data-i18n="${key('lblBio')}">${t(key('lblBio'))}</label>
        <textarea id="bio${suffix}" name="bio${suffix}" maxlength="200" rows="2" dir="${dir}"></textarea>
      </div>
    </div>
  </fieldset>`;
}

/** One live-preview card. Arabic renders first, English right below it, each
    exactly as the published page will show that language's card. */
function previewCard(lang: Lang): Raw {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const labelKey = lang === 'ar' ? 'pvLabelAr' : 'pvLabelEn';
  return html`<div class="preview-block" id="pv-block-${lang}">
    <p class="preview-label" data-i18n="${labelKey}">${t(labelKey)}</p>
    <article class="vcard glass" id="preview-${lang}" dir="${dir}" lang="${lang}">
      <span class="avatar" id="pv-avatar-${lang}">${lang === 'ar' ? 'س' : 'S'}</span>
      <p class="card-name gradient-text" id="pv-name-${lang}"></p>
      <p class="headline" id="pv-title-${lang}" hidden></p>
      <p class="company-link" id="pv-company-${lang}" hidden></p>
      <p class="bio" id="pv-bio-${lang}" hidden></p>
      <ul class="links" id="pv-links-${lang}"></ul>
      <div class="card-actions"><span class="btn btn-gradient">${STRINGS.saveContact[lang]}</span></div>
    </article>
  </div>`;
}

/** Landing page: hero + creation form + live preview. Arabic is the SSR
    default; the client script (home.js) handles the UI language toggle,
    live preview, validation, and submission. Labels carry data-i18n keys
    and every string comes from src/i18n.ts. */
export function homePage(opts: HomePageOptions = {}): string {
  const editing = Boolean(opts.edit);

  const body = html`${topbar(
    'ar',
    html`<div class="toggle-group" role="group" aria-label="Language">
      <button type="button" data-lang-btn="ar" aria-pressed="true">عربي</button>
      <button type="button" data-lang-btn="en" aria-pressed="false">EN</button>
    </div>`
  )}
<main class="container">
  <section class="hero">
    <h1 class="gradient-text" data-i18n="heroTitle">${t('heroTitle')}</h1>
    <p data-i18n="heroSub">${t('heroSub')}</p>
    <p class="public-note" data-i18n="publicNote">${t('publicNote')}</p>
  </section>

  <div class="create-layout">
    <form id="card-form" class="panel glass form-grid" novalidate>
      <div class="two-col">
        ${langFieldset('ar')}
        ${langFieldset('en')}
      </div>

      <fieldset>
        <legend data-i18n="fsContact">${t('fsContact')}</legend>
        <div class="two-col">
          <div class="field">
            <label for="email" data-i18n="lblEmail">${t('lblEmail')}</label>
            <input id="email" name="email" type="email" maxlength="254" dir="ltr" placeholder="sara@example.com" />
          </div>
          <div class="field">
            <label for="companyUrl" data-i18n="lblCompanyUrl">${t('lblCompanyUrl')}</label>
            <input id="companyUrl" name="companyUrl" maxlength="200" dir="ltr" placeholder="https://company.com" />
            <span class="hint" data-i18n="hintCompanyUrl">${t('hintCompanyUrl')}</span>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend data-i18n="fsLinks">${t('fsLinks')}</legend>
        <div class="two-col">
          ${LINK_PLATFORMS.map(
            (p) => html`<div class="field">
              <label for="link-${p}" dir="ltr">${p === 'x' ? 'X' : p.charAt(0).toUpperCase() + p.slice(1)}</label>
              <input id="link-${p}" name="link-${p}" maxlength="200" dir="ltr" placeholder="${raw(LINK_PLACEHOLDERS[p] ?? '')}" />
            </div>`
          )}
        </div>
        <span class="hint" data-i18n="hintLinks">${t('hintLinks')}</span>
      </fieldset>

      <fieldset>
        <legend data-i18n="fsTheme">${t('fsTheme')}</legend>
        <div class="field">
          <span class="field-label" data-i18n="lblAvatar">${t('lblAvatar')}</span>
          <div class="avatar-row">
            <div class="toggle-group" id="avatar-picker" role="group">
              <button type="button" data-avatar-kind="initial" aria-pressed="true" data-i18n="avInitial">${t('avInitial')}</button>
              <button type="button" data-avatar-kind="emoji" aria-pressed="false" data-i18n="avEmoji">${t('avEmoji')}</button>
              <button type="button" data-avatar-kind="hidden" aria-pressed="false" data-i18n="avHidden">${t('avHidden')}</button>
            </div>
            <div class="field emoji-field" id="emoji-field" hidden>
              <input id="avatarEmoji" name="avatarEmoji" maxlength="16" dir="ltr" placeholder="💻" aria-label="Emoji" autocomplete="off" />
            </div>
          </div>
        </div>
        <div class="field">
          <span class="field-label" data-i18n="lblPalette">${t('lblPalette')}</span>
          <div class="palette-picker" id="palette-picker" role="group">
            ${THEMES.map(
              (th, i) =>
                html`<button type="button" class="palette-chip" data-palette="${th}" aria-pressed="${i === 0 ? 'true' : 'false'}" title="${th}"><span></span></button>`
            )}
          </div>
        </div>
        <div class="field">
          <label for="defaultLang" data-i18n="lblDefaultLang">${t('lblDefaultLang')}</label>
          <select id="defaultLang" name="defaultLang">
            <option value="ar" data-i18n="optAr">${t('optAr')}</option>
            <option value="en" data-i18n="optEn">${t('optEn')}</option>
          </select>
        </div>
      </fieldset>

      <div class="form-footer">
        <button type="submit" class="btn btn-gradient" id="submit-btn" data-i18n="${editing ? 'btnSave' : 'btnCreate'}">
          ${t(editing ? 'btnSave' : 'btnCreate')}
        </button>
        <span class="form-error" id="form-error" hidden></span>
      </div>
    </form>

    <aside class="preview-pane" aria-hidden="true">
      ${previewCard('ar')}
      ${previewCard('en')}
    </aside>
  </div>

  <div id="success" class="panel glass success-panel container-narrow" hidden>
    <h3 data-i18n="successTitle">${t('successTitle')}</h3>
    <a class="card-link" id="success-link" href="/"></a>
    <div class="qr-downloads">
      <img id="success-qr" alt="QR code" src="data:," />
      <div class="qr-links">
        <a class="btn btn-ghost" id="qr-svg" href="/" download data-i18n="btnQrSvg">${t('btnQrSvg')}</a>
        <a class="btn btn-ghost" id="qr-png" href="/" download data-i18n="btnQrPng">${t('btnQrPng')}</a>
      </div>
    </div>
    <p data-i18n="successEditNote">${t('successEditNote')}</p>
    <span class="edit-code-box" id="edit-url"></span>
    <div class="qr-links">
      <a class="btn btn-gradient" id="success-open" href="/" data-i18n="btnOpenCard">${t('btnOpenCard')}</a>
      <button type="button" class="btn btn-ghost" id="success-copy" data-i18n="btnCopyLink">${t('btnCopyLink')}</button>
      <button type="button" class="btn btn-ghost" id="success-copy-edit" data-i18n="btnCopyEdit">${t('btnCopyEdit')}</button>
      <button type="button" class="btn btn-ghost" id="success-new" data-i18n="btnNewCard">${t('btnNewCard')}</button>
    </div>
  </div>
</main>
<footer class="site-footer"><span data-i18n="footer">${t('footer')}</span></footer>
${opts.edit ? html`<script type="application/json" id="edit-data">${jsonIsland({ card: editCardData(opts.edit.card), token: opts.edit.token, id: opts.edit.card.id })}</script>` : ''}`;

  return layout({
    lang: 'ar',
    title: 'بطاقتي · Bitaqati',
    description: 'Create a bilingual (Arabic/English) digital business card with a QR code - بطاقة أعمال رقمية بالعربية والإنجليزية',
    scripts: ['/js/home.js'],
    ...(opts.umami ? { umami: opts.umami } : {}),
    body,
  });
}

/** What the edit form needs - never the token hash or timestamps. */
function editCardData(card: Card) {
  const { id, published, createdAt, updatedAt, ...fields } = card;
  return fields;
}
