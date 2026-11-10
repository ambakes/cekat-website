import type { AccessibilityPreferences, Theme } from '../types/preferences.ts';

export function resolveTheme(saved: unknown, systemLight = false): Theme {
  return saved === 'light' || saved === 'dark' ? saved : systemLight ? 'light' : 'dark';
}

export function resolveAccessibility(saved: unknown, systemReducedMotion = false): AccessibilityPreferences {
  const value = saved && typeof saved === 'object' ? saved as Record<string, unknown> : {};
  return {
    text: value.text === 'lg' || value.text === 'xl' ? value.text : 'normal',
    contrast: value.contrast === true,
    motion: typeof value.motion === 'boolean' ? value.motion : systemReducedMotion,
    underline: value.underline === true
  };
}
