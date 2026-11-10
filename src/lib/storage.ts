export function readText(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function writeText(key: string, value: string): boolean {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}

export function readJSON(key: string): unknown {
  try { return JSON.parse(readText(key) ?? 'null') as unknown; } catch { return null; }
}

export function writeJSON(key: string, value: unknown): boolean {
  return writeText(key, JSON.stringify(value));
}

export function removeStored(key: string): void {
  try { localStorage.removeItem(key); } catch { /* Penyimpanan bersifat opsional. */ }
}
