import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { STORAGE_KEYS, THEME_COLORS } from '../config';
import { resolveAccessibility, resolveTheme } from '../domain/preferences';
import { readJSON, readText, removeStored, writeJSON, writeText } from '../lib/storage';
import { PreferencesContext } from './PreferencesContext';
import type { AccessibilityPreferences, Theme } from '../types/preferences';

const systemLight = () => window.matchMedia('(prefers-color-scheme: light)').matches;
const systemReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => resolveTheme(readText(STORAGE_KEYS.theme), systemLight()));
  const [accessibility, setAccessibility] = useState<AccessibilityPreferences>(() => resolveAccessibility(readJSON(STORAGE_KEYS.accessibility), systemReduced()));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('a11y-text-lg', accessibility.text === 'lg');
    root.classList.toggle('a11y-text-xl', accessibility.text === 'xl');
    root.classList.toggle('a11y-contrast', accessibility.contrast);
    root.classList.toggle('a11y-motion', accessibility.motion);
    root.classList.toggle('a11y-underline', accessibility.underline);
  }, [accessibility]);

  useEffect(() => {
    const lightQuery = window.matchMedia('(prefers-color-scheme: light)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const lightChanged = () => {
      if (!['dark', 'light'].includes(readText(STORAGE_KEYS.theme) ?? '')) setThemeState(resolveTheme(null, lightQuery.matches));
    };
    const motionChanged = () => {
      const saved = readJSON(STORAGE_KEYS.accessibility);
      const hasExplicitMotion = saved !== null && typeof saved === 'object' && 'motion' in saved && typeof saved.motion === 'boolean';
      if (!hasExplicitMotion) setAccessibility(resolveAccessibility(saved, motionQuery.matches));
    };
    const storageChanged = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.theme || event.key === null) setThemeState(resolveTheme(readText(STORAGE_KEYS.theme), lightQuery.matches));
      if (event.key === STORAGE_KEYS.accessibility || event.key === null) setAccessibility(resolveAccessibility(readJSON(STORAGE_KEYS.accessibility), motionQuery.matches));
    };
    lightQuery.addEventListener('change', lightChanged);
    motionQuery.addEventListener('change', motionChanged);
    window.addEventListener('storage', storageChanged);
    return () => {
      lightQuery.removeEventListener('change', lightChanged);
      motionQuery.removeEventListener('change', motionChanged);
      window.removeEventListener('storage', storageChanged);
    };
  }, []);

  const setTheme = useCallback((value: Theme) => {
    writeText(STORAGE_KEYS.theme, value);
    setThemeState(value);
  }, []);
  const updateAccessibility = useCallback((patch: Partial<AccessibilityPreferences>) => {
    const next = { ...accessibility, ...patch };
    writeJSON(STORAGE_KEYS.accessibility, next);
    setAccessibility(next);
  }, [accessibility]);
  const resetAccessibility = useCallback(() => {
    removeStored(STORAGE_KEYS.accessibility);
    setAccessibility(resolveAccessibility(null, systemReduced()));
  }, []);
  const value = useMemo(() => ({ theme, setTheme, accessibility, updateAccessibility, resetAccessibility }), [theme, setTheme, accessibility, updateAccessibility, resetAccessibility]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}
