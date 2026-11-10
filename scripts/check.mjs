import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (file) => readFile(path.join(root, file), 'utf8');
async function filesIn(directory) {
  const entries = await readdir(path.join(root, directory), { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const file = `${directory}/${entry.name}`;
    results.push(...entry.isDirectory() ? await filesIn(file) : [file]);
  }
  return results;
}
const exists = async (file) => { try { await access(path.join(root, file)); return true; } catch { return false; } };
const sources = (await filesIn('src')).filter((file) => /\.(?:ts|tsx)$/.test(file));
for (const file of sources) {
  const text = await read(file);
  assert(!/dangerouslySetInnerHTML|\.innerHTML\s*=|\.addEventListener\(['"]click/.test(text), `${file}: mutasi DOM/event imperatif lama tersisa`);
  for (const match of text.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)) {
    const base = path.join(path.dirname(file), match[1]);
    assert(await exists(base) || await exists(base + '.ts') || await exists(base + '.tsx') || await exists(base + '/index.ts'), `${file}: impor hilang ${match[1]}`);
  }
  for (const match of text.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)) assert(await exists('public' + match[1]), `${file}: aset hilang ${match[1]}`);
}
for (const page of ['index.html', 'alat.html']) {
  const html = await read(page);
  assert(html.includes('<div id="root"></div>'));
  assert(html.includes('src="/src/main.tsx"'));
  assert(html.includes('src="/preferences-bootstrap.js"'));
  assert(!html.includes('src="app.js"'));
}
for (const file of (await filesIn('src/styles')).filter((file) => file.endsWith('.css'))) {
  const text = await read(file);
  assert.equal((text.match(/\{/g) || []).length, (text.match(/\}/g) || []).length, file);
  for (const match of text.matchAll(/url\(["']?([^\s)"']+)["']?\)/g)) {
    if (match[1].startsWith('/assets/')) assert(await exists('public' + match[1]), `${file}: aset hilang ${match[1]}`);
    else if (match[1].startsWith('./')) assert(await exists(path.join(path.dirname(file), match[1])), `${file}: CSS hilang`);
  }
}
assert(!(await exists('src/features/checker.js')));
assert(!(await exists('src/domain/analyzers.js')));
assert(!(await exists('src/data/known-domains.js')));
const responsive = await read('src/styles/responsive.css');
assert(/\.checker-ecg\s*\{\s*display:\s*none;/.test(responsive));
assert((await read('src/styles/tokens.css')).includes('--primary: #8ce0b2;'));
console.log(`Pemeriksaan struktur lolos: ${sources.length} sumber TypeScript, dua entry React, aset, CSS, dan penghapusan engine lama.`);
console.log('Pemeriksaan ini tidak menggantikan tsc, build Vite, atau pengujian browser.');
