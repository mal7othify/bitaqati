export const THEMES = ['black', 'gray', 'rose', 'lavender', 'mint', 'peach', 'sky'] as const;
export type Theme = (typeof THEMES)[number];

export const LANGS = ['ar', 'en'] as const;
export type Lang = (typeof LANGS)[number];

/** Spec §2: GitHub, YouTube, X, LinkedIn, Bluesky, Mastodon, Instagram. */
export const LINK_PLATFORMS = ['github', 'youtube', 'x', 'linkedin', 'bluesky', 'mastodon', 'instagram'] as const;
export type LinkPlatform = (typeof LINK_PLATFORMS)[number];

/** Card avatar: the name's first letter (default), a chosen emoji, or none. */
export const AVATAR_KINDS = ['initial', 'emoji', 'hidden'] as const;
export type AvatarKind = (typeof AVATAR_KINDS)[number];

export interface CardInput {
  nameAr?: string;
  nameEn?: string;
  titleAr?: string;
  titleEn?: string;
  companyAr?: string;
  companyEn?: string;
  companyUrl?: string;
  bioAr?: string;
  bioEn?: string;
  email?: string;
  links: Partial<Record<LinkPlatform, string>>;
  theme: Theme;
  defaultLang: Lang;
  avatarKind: AvatarKind;
  /** Present only when avatarKind is 'emoji'. */
  avatarEmoji?: string;
}

export interface Card extends CardInput {
  id: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Theme accent used for OG meta / QR tint pairing (light-mode accents). */
export const THEME_ACCENT: Record<Theme, string> = {
  rose: '#a03a62',
  lavender: '#6b4aa8',
  mint: '#1e6f55',
  peach: '#9d4f1c',
  sky: '#2c5f92',
  black: '#2e2e33',
  gray: '#4e5a66',
};
