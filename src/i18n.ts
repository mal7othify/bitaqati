/* ---------------------------------------------------------------------------
   ALL user-facing text, Arabic and English, the server renders from
   this table and also embeds it as a JSON island (#i18n-data) in every
   page, which the browser scripts (home.js / card.js) read at runtime.
   Renaming a key requires updating the matching data-i18n attributes in
   the markup and any client-script references.
--------------------------------------------------------------------------- */

import { Lang } from "./types.js";

export type LocaleEntry = Record<Lang, string>;

export const STRINGS = {
  /* Brand & layout */
  brand: { ar: "بطاقتي", en: "Bitaqati" },
  footer: {
    ar: "هويتك المهنية، بشكل رقمي",
    en: "Your professional identity, digitally",
  },

  /* Landing hero */
  heroTitle: {
    ar: "بطاقة أعمال رقمية، بالعربي والإنجليزي",
    en: "A digital business card, in Arabic and English",
  },
  heroSub: {
    ar: "سوّي بطاقتك، شارك رابطها أو رمز QR في المؤتمرات والفعاليات، وخلي أي شخص يحفظ بيانات تواصلك بضغطة واحدة.",
    en: "Create your card, share its link or QR code at events, and let anyone save your contact in one tap.",
  },
  publicNote: {
    ar: "البطاقات المنشورة عامة - أي أحد عنده الرابط يقدر يفتحها.",
    en: "Published cards are public - anyone with the link can open them.",
  },

  /* Form: language sections */
  fsAr: { ar: "بالعربي", en: "In Arabic" },
  fsEn: { ar: "بالإنجليزي", en: "In English" },
  lblName: { ar: "الاسم", en: "Name (Arabic)" },
  lblTitle: { ar: "المسمى الوظيفي", en: "Job title (Arabic)" },
  lblCompany: { ar: "جهة العمل", en: "Company (Arabic)" },
  lblBio: { ar: "نبذة بسيطة", en: "Short bio (Arabic)" },
  lblName2: { ar: "الاسم", en: "Name" },
  lblTitle2: { ar: "المسمى الوظيفي", en: "Job title" },
  lblCompany2: { ar: "جهة العمل", en: "Company" },
  lblBio2: { ar: "نبذة بسيطة", en: "Short bio" },
  /* Example values shown as input placeholders (per card language, not UI language) */
  phName: { ar: "مريم علي", en: "Maryam Ali" },
  phTitle: { ar: "مهندسة برمجيات", en: "Software Engineer" },

  /* Form: contact & links */
  fsContact: { ar: "التواصل", en: "Contact" },
  lblEmail: { ar: "البريد الإلكتروني", en: "Email" },
  lblCompanyUrl: {
    ar: "رابط جهة العمل (اختياري)",
    en: "Company URL (optional)",
  },
  hintCompanyUrl: {
    ar: "إذا ما أضفت رابط، بيظهر اسم الجهة كنص بس",
    en: "Without a URL the company shows as plain text",
  },
  fsLinks: {
    ar: "روابطك (اللي تعبّيه بس بيظهر)",
    en: "Your links (only filled ones show)",
  },
  hintLinks: {
    ar: "استخدم روابط https فقط، وعلى نطاق المنصة الصحيح",
    en: "https links only, on the right platform domain",
  },

  /* Form: appearance */
  fsTheme: { ar: "المظهر", en: "Appearance" },
  lblAvatar: { ar: "الشعار", en: "Logo" },
  avInitial: { ar: "أول حرف", en: "First letter" },
  avEmoji: { ar: "إيموجي", en: "Emoji" },
  avHidden: { ar: "بدون", en: "None" },
  lblPalette: { ar: "الألوان", en: "Colors" },
  lblDefaultLang: {
    ar: "اللغة الافتراضية للبطاقة",
    en: "Card default language",
  },
  optAr: { ar: "العربي", en: "Arabic" },
  optEn: { ar: "الإنجليزي", en: "English" },

  /* Live preview */
  pvLabelAr: { ar: "معاينة البطاقة بالعربي", en: "Arabic card preview" },
  pvLabelEn: { ar: "معاينة البطاقة بالإنجليزي", en: "English card preview" },
  pvYourName: { ar: "اسمك هنا", en: "Your name" },

  /* Buttons & success panel */
  btnCreate: { ar: "انشر بطاقتي ✨", en: "Publish my card ✨" },
  btnSave: { ar: "احفظ التعديلات ✨", en: "Save changes ✨" },
  saveContact: { ar: "احفظ جهة الاتصال", en: "Save contact" },
  successTitle: { ar: "بطاقتك جاهزة! 🎉", en: "Your card is live! 🎉" },
  successSaved: { ar: "تم حفظ التعديلات", en: "Changes saved" },
  successEditNote: {
    ar: "احفظ رابط التعديل هذا في مكان آمن - هذا الرابط هو الطريقة الوحيدة اللي تقدر تعدّل فيها بطاقتك:",
    en: "Keep this edit link somewhere safe - it is the only way to edit your card:",
  },
  btnQrSvg: { ar: "QR (SVG للطباعة)", en: "QR (SVG for print)" },
  btnQrPng: { ar: "QR (PNG)", en: "QR (PNG)" },
  btnOpenCard: { ar: "افتح البطاقة", en: "Open the card" },
  btnCopyLink: { ar: "انسخ الرابط", en: "Copy link" },
  btnCopyEdit: { ar: "انسخ رابط التعديل", en: "Copy edit link" },
  btnNewCard: { ar: "سوّي بطاقة جديدة", en: "Create a new card" },
  copied: { ar: "تم النسخ ✓", en: "Copied ✓" },

  /* Validation & errors ({p} = platform name) */
  errName: {
    ar: "فضلاً اكتب الاسم بالعربي أو بالإنجليزي أول",
    en: "Please enter a name in Arabic or English first",
  },
  errEmail: {
    ar: "البريد الإلكتروني مو واضح إنه صحيح",
    en: "That email doesn’t look right",
  },
  errCompanyUrl: {
    ar: "رابط جهة العمل لازم يكون رابط https صالح",
    en: "Company URL must be a valid https:// link",
  },
  errLink: {
    ar: "رابط {p} لازم يكون رابط https وعلى نطاق المنصة الصحيح",
    en: "The {p} link must be an https link on the right domain",
  },
  errEmoji: {
    ar: "اختار إيموجي واحد للشعار",
    en: "Pick one emoji for the logo",
  },
  errCardEmpty: {
    ar: "أضف مع الاسم شيء واحد على الأقل: مسمى وظيفي، جهة عمل مع رابطها، بريد إلكتروني، أو أي رابط تواصل",
    en: "Along with the name, add at least one of: a job title, a company with its link, an email, or any link",
  },
  errOneLang: {
    ar: "خلي قسم واحد على الأقل: العربي أو الإنجليزي",
    en: "Keep at least one section: Arabic or English",
  },
  errGeneric: {
    ar: "صار خطأ، حاول مرة ثانية",
    en: "Something went wrong - please try again",
  },
  errRate: {
    ar: "في محاولات كثيرة - انتظر شوية وبعدين حاول مرة ثانية",
    en: "Too many attempts - wait a bit and try again",
  },

  /* Public card page */
  createOwn: { ar: "سوّي بطاقتك أنت كمان ✨", en: "Create your own card ✨" },
  report: { ar: "بلّغ عن هذه البطاقة", en: "Report this card" },
  reportPrompt: {
    ar: "إيش سبب البلاغ؟",
    en: "Why are you reporting this card?",
  },
  reportSubject: { ar: "بلاغ عن بطاقة", en: "Reporting a card" },
  reportBody: {
    ar: "أرغب بالإبلاغ عن هذه البطاقة:",
    en: "I would like to report this card:",
  },
  reportReason: { ar: "السبب:", en: "Reason:" },
  reportDone: {
    ar: "وصلنا البلاغ، شكرًا لك.",
    en: "Report received - thank you.",
  },
  ogFallback: { ar: "بطاقة أعمال رقمية", en: "Digital business card" },

  /* GitHub footer link, on every page */
  contribute: {
    ar: "ساهم في هذا المشروع على GitHub",
    en: "Contribute to this project on GitHub",
  },

  /* Theme toggle (sun/moon) */
  themeToggle: { ar: "تبديل الوضع الليلي", en: "Toggle dark mode" },

  /* Not-found page */
  nfTitle: { ar: "ما في بطاقة هنا", en: "No card here" },
  nfSub: {
    ar: "ممكن الرابط اتغيّر أو البطاقة اتشالت من النشر.",
    en: "Maybe the link changed, or the card was unpublished.",
  },
  nfCta: { ar: "للصفحة الرئيسية", en: "Back home" },

  /* vCard download: NOTE label for the other-language name, written in
     the vCard's own language (the Arabic .vcf labels the English name in
     Arabic, and vice versa). */
  vcfNameNote: { ar: "الاسم بالإنجليزي", en: "Name in Arabic" },
} satisfies Record<string, LocaleEntry>;

export type StringKey = keyof typeof STRINGS;

/** SSR default text for a data-i18n element (the UI's SSR language is Arabic). */
export const t = (key: StringKey): string => STRINGS[key].ar;
