import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeQris, crc16, parseTlv } from '../src/features/qris/analyzeQris.ts';
import { demoQris, invalidQris } from '../src/features/qris/samples.ts';

test('CRC-16 memakai vektor uji standar', () => assert.equal(crc16('123456789'), '29B1'));
test('QRIS contoh terbaca tanpa dinyatakan pasti aman', () => {
  const result = analyzeQris(demoQris);
  assert.equal(result.level, 'caution');
  assert.equal(result.merchant, 'KEDAI SORE');
  assert.equal(result.city, 'MAKASSAR');
  assert(result.findings.some((finding) => finding.includes('tidak membuktikan identitas')));
});
test('CRC yang diubah menghasilkan peringatan', () => assert.equal(analyzeQris(invalidQris).level, 'warning'));
test('TLV menolak panjang rusak, nonangka, dan data yang terpotong', () => {
  for (const text of ['5905ABC', '59 1X', '59x1A', '5901AX']) assert.equal(parseTlv(text), null, text);
});
test('payload kosong atau bukan QRIS tidak mengklaim keamanan', () => {
  assert.equal(analyzeQris('').level, 'caution');
  assert.equal(analyzeQris('teks biasa').level, 'caution');
});
test('QR berisi URL tidak menjalankan kembali mesin cek tautan', () => {
  const result = analyzeQris('https://contoh.invalid');
  assert.equal(result.title, 'QR berisi alamat web');
  assert(result.findings.some((finding) => finding.includes('tidak menilai keamanan tautan')));
});
test('CRC ganda atau bukan field terakhir ditolak', () => {
  const appended = demoQris + '9901X';
  const duplicated = demoQris + '63040000';
  assert.equal(analyzeQris(appended).level, 'warning');
  assert.equal(analyzeQris(duplicated).level, 'warning');
});
test('data penerima ditampilkan sebagai teks, tidak dijalankan sebagai HTML', () => {
  const prefix = '0002015908<script>6304';
  const result = analyzeQris(prefix + crc16(prefix));
  assert.equal(result.merchant, '<script>');
  assert.equal(result.level, 'caution');
});
