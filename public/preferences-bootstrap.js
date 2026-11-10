// Dibuat dari src/config.ts dan src/domain/preferences.ts. Jangan diedit langsung.
(() => {
  const keys = {"theme":"cekat-theme","accessibility":"cekat-a11y","reading":"cekat-book-resume"};
  function resolveTheme(saved         , systemLight = false)        {
  return saved === 'light' || saved === 'dark' ? saved : systemLight ? 'light' : 'dark';
}
  function resolveAccessibility(saved         , systemReducedMotion = false)                           {
  const value = saved && typeof saved === 'object' ? saved                            : {};
  return {
    text: value.text === 'lg' || value.text === 'xl' ? value.text : 'normal',
    contrast: value.contrast === true,
    motion: typeof value.motion === 'boolean' ? value.motion : systemReducedMotion,
    underline: value.underline === true
  };
}
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
