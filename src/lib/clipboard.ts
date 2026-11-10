export async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try { await navigator.clipboard.writeText(text); return true; } catch { /* Gunakan fallback. */ }
  }
  const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const area = document.createElement('textarea');
  area.value = text;
  area.readOnly = true;
  area.className = 'clipboard-fallback';
  document.body.append(area);
  area.select();
  let success = false;
  try { success = document.execCommand('copy'); } catch { /* Pemilik UI menampilkan pesan kegagalan. */ }
  area.remove();
  previous?.focus({ preventScroll: true });
  return success;
}
