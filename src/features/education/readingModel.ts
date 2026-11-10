export function resolveReadingBookmark(saved: unknown, validIds: readonly string[]): string | null {
  if (!saved || typeof saved !== 'object' || !('id' in saved) || typeof saved.id !== 'string') return null;
  return validIds.includes(saved.id) ? saved.id : null;
}
