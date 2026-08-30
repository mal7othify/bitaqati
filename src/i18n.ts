/* ---------------------------------------------------------------------------
   ALL user-facing text, Arabic and English, the server renders from
   this table and also embeds it as a JSON island (#i18n-data) in every
   page, which the browser scripts (home.js / card.js) read at runtime.
   Renaming a key requires updating the matching data-i18n attributes in
   the markup and any client-script references.
--------------------------------------------------------------------------- */

import { Lang } from './types.js';

export type LocaleEntry = Record<Lang, string>;

export const STRINGS = {
  /* Brand & layout */
  brand: { ar: 'بطاقتي', en: 'Bitaqati' },
  footer: { ar: 'هويتك المهنية، رقمياً', en: 'Your professional identity, digitally' },

  /* Landing hero */
  heroTitle: { ar: 'بطاقة أعمال رقمية، بالعربي والإنجليزي', en: 'A digital business card, in Arabic and English' },
  heroSub: {
    ar: 'أنشئ بطاقتك، شارك رابطها أو رمز QR في المؤتمرات، ودع أي شخص يحفظ جهة اتصالك بضغطة واحدة.',
    en: 'Create your card, share its link or QR code at events, and let anyone save your contact in one tap.',
  },
  publicNote: { ar: 'البطاقات المنشورة عامة - أي شخص لديه الرابط يستطيع فتحها.', en: 'Published cards are public - anyone with the link can open them.' },

  /* Form: language sections */
  fsAr: { ar: 'بالعربية', en: 'In Arabic' },
  fsEn: { ar: 'بالإنجليزية', en: 'In English' },
  lblName: { ar: 'الاسم', en: 'Name (Arabic)' },
  lblTitle: { ar: 'المسمى الوظيفي', en: 'Job title (Arabic)' },
  lblCompany: { ar: 'جهة العمل', en: 'Company (Arabic)' },
  lblBio: { ar: 'نبذة قصيرة', en: 'Short bio (Arabic)' },
  lblName2: { ar: 'الاسم', en: 'Name' },
  lblTitle2: { ar: 'المسمى الوظيفي', en: 'Job title' },
  lblCompany2: { ar: 'جهة العمل', en: 'Company' },
  lblBio2: { ar: 'نبذة قصيرة', en: 'Short bio' },
  /* Example values shown as input placeholders (per card language, not UI language) */
  phName: { ar: 'سارة العتيبي', en: 'Sara Alotaibi' },
  phTitle: { ar: 'مهندسة برمجيات', en: 'Software Engineer' },

  /* Form: contact & links */
  fsContact: { ar: 'التواصل', en: 'Contact' },
  lblEmail: { ar: 'البريد الإلكتروني', en: 'Email' },
  lblCompanyUrl: { ar: 'رابط جهة العمل (اختياري)', en: 'Company URL (optional)' },
  hintCompanyUrl: { ar: 'بدون رابط، يظهر اسم الجهة كنص فقط', en: 'Without a URL the company shows as plain text' },
  fsLinks: { ar: 'روابطك (تُعرض فقط ما تعبّئه)', en: 'Your links (only filled ones show)' },
  hintLinks: { ar: 'روابط https فقط، وعلى نطاق المنصة الصحيح', en: 'https links only, on the right platform domain' },

  /* Form: appearance */
  fsTheme: { ar: 'المظهر', en: 'Appearance' },
  lblAvatar: { ar: 'الشعار', en: 'Logo' },
  avInitial: { ar: 'الحرف الأول', en: 'First letter' },
  avEmoji: { ar: 'إيموجي', en: 'Emoji' },
  avHidden: { ar: 'بدون', en: 'None' },
  lblPalette: { ar: 'الألوان', en: 'Colors' },
  lblDefaultLang: { ar: 'اللغة الافتراضية للبطاقة', en: 'Card default language' },
  optAr: { ar: 'العربية', en: 'Arabic' },
  optEn: { ar: 'English', en: 'English' },

  /* Live preview */
  pvLabelAr: { ar: 'معاينة البطاقة العربية', en: 'Arabic card preview' },
  pvLabelEn: { ar: 'معاينة البطاقة الإنجليزية', en: 'English card preview' },
  pvYourName: { ar: 'اسمك هنا', en: 'Your name' },

  /* Buttons & success panel */
  btnCreate: { ar: 'نشر البطاقة ✨', en: 'Publish my card ✨' },
  btnSave: { ar: 'حفظ التعديلات ✨', en: 'Save changes ✨' },
  saveContact: { ar: 'حفظ جهة الاتصال', en: 'Save contact' },
  successTitle: { ar: 'بطاقتك جاهزة! 🎉', en: 'Your card is live! 🎉' },
  successSaved: { ar: 'تم حفظ التعديلات', en: 'Changes saved' },
  successEditNote: {
    ar: 'احفظ رابط التعديل هذا في مكان آمن - هو الطريقة الوحيدة لتعديل بطاقتك:',
    en: 'Keep this edit link somewhere safe - it is the only way to edit your card:',
  },
  btnQrSvg: { ar: 'QR (SVG للطباعة)', en: 'QR (SVG for print)' },
  btnQrPng: { ar: 'QR (PNG)', en: 'QR (PNG)' },
  btnOpenCard: { ar: 'افتح البطاقة', en: 'Open the card' },
  btnCopyLink: { ar: 'نسخ الرابط', en: 'Copy link' },
  btnCopyEdit: { ar: 'نسخ رابط التعديل', en: 'Copy edit link' },
  btnNewCard: { ar: 'أنشئ بطاقة جديدة', en: 'Create a new card' },
  copied: { ar: 'تم النسخ ✓', en: 'Copied ✓' },

  /* Validation & errors ({p} = platform name) */
  errName: { ar: 'فضلًا اكتب الاسم بالعربية أو الإنجليزية أولًا', en: 'Please enter a name in Arabic or English first' },
  errEmail: { ar: 'البريد الإلكتروني لا يبدو صحيحًا', en: 'That email doesn’t look right' },
  errCompanyUrl: { ar: 'رابط جهة العمل يجب أن يكون رابط https صالحًا', en: 'Company URL must be a valid https:// link' },
  errLink: { ar: 'رابط {p} يجب أن يكون رابط https على نطاق المنصة الصحيح', en: 'The {p} link must be an https link on the right domain' },
  errEmoji: { ar: 'اختر إيموجي واحدًا للشعار', en: 'Pick one emoji for the logo' },
  errOneLang: { ar: 'أبقِ قسمًا واحدًا على الأقل: العربية أو الإنجليزية', en: 'Keep at least one section: Arabic or English' },
  errGeneric: { ar: 'حدث خطأ، حاول مرة أخرى', en: 'Something went wrong - please try again' },
  errRate: { ar: 'محاولات كثيرة - انتظر قليلًا ثم أعد المحاولة', en: 'Too many attempts - wait a bit and try again' },

  /* Public card page */
  createOwn: { ar: 'أنشئ بطاقتك أنت أيضًا ✨', en: 'Create your own card ✨' },
  report: { ar: 'إبلاغ عن هذه البطاقة', en: 'Report this card' },
  reportPrompt: { ar: 'ما سبب الإبلاغ؟', en: 'Why are you reporting this card?' },
  reportDone: { ar: 'تم استلام البلاغ، شكرًا لك.', en: 'Report received - thank you.' },
  ogFallback: { ar: 'بطاقة تعريف رقمية', en: 'Digital business card' },

  /* Not-found page */
  nfTitle: { ar: 'لا توجد بطاقة هنا', en: 'No card here' },
  nfSub: { ar: 'ربما تغيّر الرابط أو أُلغي نشر البطاقة.', en: 'Maybe the link changed, or the card was unpublished.' },
  nfCta: { ar: 'إلى الصفحة الرئيسية', en: 'Back home' },

  /* vCard download: label for the other-language name in NOTE.
     Deliberately cross-language - the Arabic .vcf labels the English name
     in English, and vice versa. */
  vcfNameNote: { ar: 'الاسم بالعربي', en: 'Name in English' },
} satisfies Record<string, LocaleEntry>;

export type StringKey = keyof typeof STRINGS;

/** SSR default text for a data-i18n element (the UI's SSR language is Arabic). */
export const t = (key: StringKey): string => STRINGS[key].ar;
