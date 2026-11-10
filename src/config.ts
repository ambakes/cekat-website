export const STORAGE_KEYS = {
  theme: 'cekat-theme',
  accessibility: 'cekat-a11y',
  reading: 'cekat-book-resume'
} as const;

export const BREAKPOINTS = { mobile: 640, menu: 820, education: 900 } as const;
export const THEME_COLORS = { dark: '#0b0b10', light: '#f5f6fa' } as const;
export type PageKind = 'home' | 'education';
