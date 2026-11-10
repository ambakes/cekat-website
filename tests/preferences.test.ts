import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { resolveAccessibility, resolveTheme } from '../src/domain/preferences.ts';
import { STORAGE_KEYS } from '../src/config.ts';
import { resolveReadingBookmark } from '../src/features/education/readingModel.ts';

test('tema mengikuti pilihan tersimpan, lalu preferensi perangkat', () => {
  assert.equal(resolveTheme('dark', true), 'dark');
  assert.equal(resolveTheme('light', false), 'light');
  assert.equal(resolveTheme('tidak-valid', true), 'light');
});
test('preferensi rusak tidak memutus aplikasi', () => {
  for (const value of [null, false, [], 'broken', 123]) assert.deepEqual(resolveAccessibility(value, true), { text: 'normal', contrast: false, motion: true, underline: false });
  assert.deepEqual(resolveAccessibility({ text: 'xl', contrast: true, motion: false, underline: true }, true), { text: 'xl', contrast: true, motion: false, underline: true });
});
test('bookmark hanya menerima bab yang benar-benar ada', () => {
  assert.equal(resolveReadingBookmark({ id: 'otp' }, ['phishing', 'otp']), 'otp');
  for (const value of [null, { id: 'hilang' }, { id: 1 }, '<script>']) assert.equal(resolveReadingBookmark(value, ['otp']), null);
});
test('bootstrap awal tetap bekerja ketika localStorage diblokir', async () => {
  const source = await readFile(new URL('../public/preferences-bootstrap.js', import.meta.url), 'utf8');
  const classes = new Set<string>();
  const root = { dataset: {} as Record<string, string>, classList: { toggle(key: string, active: boolean) { if (active) classes.add(key); else classes.delete(key); } } };
  vm.runInNewContext(source, { document: { documentElement: root }, window: { matchMedia: () => ({ matches: true }) }, localStorage: { getItem() { throw new Error('blocked'); } } });
  assert.equal(root.dataset.theme, 'light');
  assert(classes.has('a11y-motion'));
  assert(source.includes(STORAGE_KEYS.theme));
  assert(source.includes(STORAGE_KEYS.accessibility));
});
