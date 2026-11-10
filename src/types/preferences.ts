export type Theme = 'dark' | 'light';
export type TextSize = 'normal' | 'lg' | 'xl';
export interface AccessibilityPreferences {
  text: TextSize;
  contrast: boolean;
  motion: boolean;
  underline: boolean;
}
