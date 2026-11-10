import { createContext } from 'react';
import type { AccessibilityPreferences, Theme } from '../types/preferences';

export interface PreferencesValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  accessibility: AccessibilityPreferences;
  updateAccessibility: (patch: Partial<AccessibilityPreferences>) => void;
  resetAccessibility: () => void;
}

export const PreferencesContext = createContext<PreferencesValue | null>(null);
