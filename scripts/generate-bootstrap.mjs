import { writeFile } from 'node:fs/promises';
import { STORAGE_KEYS } from '../src/config.ts';
import { resolveTheme, resolveAccessibility } from '../src/domain/preferences.ts';

const source = `// Dibuat dari src/config.ts dan src/domain/preferences.ts. Jangan diedit langsung.
(() => {
  const keys = ${JSON.stringify(STORAGE_KEYS)};
  ${resolveTheme.toString()}
  ${resolveAccessibility.toString()}
  const read = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
  const root = document.documentElement;
  root.dataset.theme = resolveTheme(read(keys.theme), window.matchMedia('(prefers-color-scheme: light)').matches);
  let saved = null;
  try { saved = JSON.parse(read(keys.accessibility)); } catch { /* Gunakan nilai awal. */ }
  const preferences = resolveAccessibility(saved, window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  root.classList.toggle('a11y-text-lg', preferences.text === 'lg');
  root.classList.toggle('a11y-text-xl', preferences.text === 'xl');
  root.classList.toggle('a11y-contrast', preferences.contrast);
  root.classList.toggle('a11y-motion', preferences.motion);
  root.classList.toggle('a11y-underline', preferences.underline);
})();
`;
await writeFile(new URL('../public/preferences-bootstrap.js', import.meta.url), source);
console.log('Bootstrap preferensi diperbarui.');
