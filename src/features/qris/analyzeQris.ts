import type { QrisResult, TlvField } from './types.ts';

/** CRC menguji integritas struktur, bukan identitas atau keabsahan penerima. */
export function crc16(text: string): string {
  let crc = 0xffff;
  for (let index = 0; index < text.length; index += 1) {
    crc ^= text.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit += 1) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    crc &= 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function parseTlv(text: string): TlvField[] | null {
  const fields: TlvField[] = [];
  let offset = 0;
  while (offset + 4 <= text.length) {
    const id = text.slice(offset, offset + 2);
    const size = text.slice(offset + 2, offset + 4);
    if (!/^\d{2}$/.test(id) || !/^\d{2}$/.test(size)) return null;
    const length = Number(size);
    if (offset + 4 + length > text.length) return null;
    fields.push({ id, value: text.slice(offset + 4, offset + 4 + length) });
    offset += 4 + length;
  }
  return offset === text.length ? fields : null;
}

export function analyzeQris(text: string): QrisResult {
  const raw = text.trim();
  if (!raw) return { level: 'caution', title: 'Belum ada isi QRIS', findings: ['Tempel teks hasil pindai QRIS yang ingin kamu periksa.'] };
  if (/^https?:\/\//i.test(raw)) return {
    level: 'caution', title: 'QR berisi alamat web',
    findings: ['Data ini berupa alamat web, bukan payload QRIS yang dapat diurai.', 'Pemeriksaan ini tidak menilai keamanan tautan. Cocokkan tujuan pembayaran melalui aplikasi resmi.']
  };
  if (!raw.startsWith('000201')) return {
    level: 'caution', title: 'Format QRIS belum dikenali',
    findings: ['CEKAT belum mengenali struktur QRIS pada teks ini.', 'Pastikan nama penerima dan nominal melalui aplikasi pembayaran sebelum memasukkan PIN.']
  };
  const fields = parseTlv(raw);
  if (!fields) return {
    level: 'warning', title: 'Struktur QRIS tidak lengkap',
    findings: ['Panjang salah satu data tidak cocok dengan isi QRIS.', 'Jangan lanjutkan pembayaran; minta kode baru dari penjual.']
  };
  const merchant = fields.find((field) => field.id === '59')?.value;
  const city = fields.find((field) => field.id === '60')?.value;
  const amountValue = fields.find((field) => field.id === '54')?.value;
  const validAmount = amountValue === undefined || (/^\d+(?:\.\d+)?$/.test(amountValue) && Number.isFinite(Number(amountValue)));
  const amount = amountValue !== undefined && validAmount ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 2 }).format(Number(amountValue)) : undefined;
  const checksums = fields.filter((field) => field.id === '63');
  const checksum = checksums[0];
  const validChecksum = checksums.length === 1 && checksum === fields.at(-1)
    && /^[\da-f]{4}$/i.test(checksum.value) && crc16(raw.slice(0, -4)) === checksum.value.toUpperCase();
  const findings: string[] = [];
  if (merchant) findings.push(`Nama penerima: ${merchant}`);
  if (city) findings.push(`Kota: ${city}`);
  if (amount) findings.push(`Nominal tertulis: ${amount}`);
  if (!validAmount) findings.push('Data nominal tidak terbaca sebagai angka yang valid.');
  if (fields.some((field) => field.id === '01' && field.value === '12')) findings.push('Kode ditandai sebagai pembayaran dinamis. Periksa jumlah akhir di aplikasi.');
  findings.push(validChecksum ? 'Struktur dan CRC cocok. Ini tidak membuktikan identitas penerima.' : 'CRC hilang, tidak cocok, atau berada pada posisi yang tidak valid. Minta kode baru.');
  return {
    level: validChecksum && validAmount ? 'caution' : 'warning',
    title: validChecksum && validAmount ? 'Struktur QRIS terbaca' : 'Periksa QRIS sebelum membayar',
    findings, merchant, city, amount
  };
}
