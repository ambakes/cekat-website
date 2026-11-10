import { BRANDS } from './brands';

export type Risk = 'low' | 'medium' | 'high';
export type Severity = Risk;
export type LinkStatus = 'safe' | 'suspicious' | 'dangerous' | 'unknown';
export interface Finding { severity: Severity; message: string }
export interface UrlFinding { url: string; status: LinkStatus; matchedDomain: string | null; findings: string[]; reputation?: LinkResult['reputation']; threatTypes?: string[] }
export interface LinkResult { status: LinkStatus; hostname: string; matchedDomain: string | null; findings: string[]; reputation: 'threat_detected' | 'no_known_threat' | 'unavailable' | 'unconfigured'; threatTypes: string[]; error?: string }
export interface RiskResult { risk: Risk; score: number; findings: Finding[]; urls?: UrlFinding[]; advice?: string }
export interface MessageResult extends RiskResult {
  external?: { available: boolean; classification?: string; isSpam?: boolean; confidence?: number | null; reasons?: string[]; recommendations?: string[]; error?: string };
}
export interface QrisData {
  mode: string; merchantName: string | null; city: string | null; country: string | null;
  currency: string | null; amount: number | null; amountRaw: string | null; mcc: string | null;
  crcValid: boolean; crcExpected: string | null; crcActual: string | null;
  merchantAccounts: { tag: string; guid: string | null; merchantId: string | null }[];
}
export interface WifiData { ssid: string | null; security: string | null; hidden: boolean }
export interface QrResult extends RiskResult { type: string; qris: QrisData | null; wifi?: WifiData | null; external?: MessageResult['external'] | null }

interface Brand { name: string; domains: string[] }
const IPV4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const COUNTRY_SUFFIXES = new Set(['co.id','com.id','or.id','ac.id','go.id','co.uk','org.uk','ac.uk','gov.uk','com.au','net.au','org.au','co.nz','com.br','com.mx','com.ar','com.tr','com.cn','com.hk','com.sg','com.my','com.ph','com.tw','com.vn','com.pk','co.in','firm.in','net.in','org.in','co.jp','co.kr','co.za','com.ng','com.eg','com.sa','com.pl','com.ua','com.de','com.fr','com.es','com.it']);
const GENERIC_LABELS = new Set('mail email web site page pages home news blog shop store bank pay support help login account admin portal auth secure safe trust cloud dns nic reg who ntp loc svc img cdn api app apps dev test static media photo image file files video music games game play live chat office docs drive forms note notes share link code data tech digital network online global local mobile phone smart time people weather travel sport health education free best top new first prime plus pro max super ultra mega micro soft open direct express fast quick easy simple true real original official name state goal focus force one bit service services'.split(' '));
const MULTI_TENANT_DOMAINS = new Set(['blogspot.com','wixsite.com','weebly.com','myshopify.com','sharepoint.com','azurewebsites.net','herokuapp.com','netlify.app','vercel.app','tumblr.com','substack.com','workers.dev','github.io']);
const brandList = (BRANDS as Brand[]).map((brand, index) => ({ ...brand, token: brand.name.toLowerCase(), isSeed: index < 40 })).filter((brand) => brand.token.length >= 3 && /^[a-z]+$/.test(brand.token) && (brand.isSeed || !GENERIC_LABELS.has(brand.token)));

function normalizeLabel(label: string) { return label.toLowerCase().replace(/0/g,'o').replace(/1/g,'l').replace(/3/g,'e').replace(/5/g,'s').replace(/[^a-z]/g,''); }
function editDistance(a: string, b: string) {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    previous = current;
  }
  return previous[b.length];
}
function matchOfficialDomain(host: string, brand: typeof brandList[number]) {
  const literal = brand.domains.find((domain) => host === domain || host.endsWith(`.${domain}`));
  if (literal) return literal;
  const parts = host.split('.'); const last = parts.at(-1) ?? ''; const secondLast = parts.at(-2) ?? '';
  if (last.length === 2 && secondLast === brand.token) return `${brand.token}.${last}`;
  if (COUNTRY_SUFFIXES.has(`${secondLast}.${last}`) && parts.at(-3) === brand.token) return `${brand.token}.${secondLast}.${last}`;
  return null;
}
function findKnownDomain(host: string) {
  for (const brand of brandList) {
    const matched = matchOfficialDomain(host, brand);
    if (!matched) continue;
    if (MULTI_TENANT_DOMAINS.has(matched) && host !== matched) return null;
    return matched;
  }
  return null;
}
function findBrandImpersonation(host: string) {
  const labels = host.split('.').filter(Boolean);
  for (const brand of brandList) {
    if (matchOfficialDomain(host, brand)) continue;
    let typo = false;
    for (const label of labels) {
      const normalized = normalizeLabel(label);
      if (label === brand.token || label.split('-').includes(brand.token) || normalized === brand.token) return { brand, typo: false };
      if (brand.isSeed && !GENERIC_LABELS.has(normalized) && brand.token.length >= 5 && Math.abs(normalized.length - brand.token.length) <= 1 && editDistance(normalized, brand.token) <= 1) typo = true;
    }
    if (typo) return { brand, typo: true };
  }
  return null;
}
const TRAILING_URL_PUNCTUATION = /[.,;:!?)\]}]+$/;
export function extractUrls(text: string) {
  const found = text.match(/https?:\/\/[^\s<>"'`]+/gi) ?? [];
  return [...new Set(found.map((url) => url.replace(TRAILING_URL_PUNCTUATION, '')).filter(Boolean))].slice(0, 3);
}

export function analyzeUrl(rawUrl: string): LinkResult {
  let url: URL;
  try { url = new URL(rawUrl.trim()); } catch { throw new Error('Format URL tidak valid.'); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('URL harus menggunakan HTTP atau HTTPS.');
  const host = url.hostname.toLowerCase(); const findings: string[] = [];
  if (IPV4.test(host)) findings.push('Menggunakan alamat IP langsung.');
  if (host.includes('xn--')) findings.push('Domain menggunakan format Punycode.');
  if (url.username || url.password) findings.push('URL mengandung informasi login sebelum nama host.');
  if (host.split('.').length >= 5) findings.push('Domain memiliki banyak tingkat subdomain.');
  if (rawUrl.length > 200) findings.push('URL sangat panjang.');
  const matchedDomain = findKnownDomain(host); const impersonation = findBrandImpersonation(host);
  if (impersonation) findings.unshift(impersonation.typo
    ? `Nama domain sangat mirip dengan ${impersonation.brand.name} (domain resmi: ${impersonation.brand.domains[0]}).`
    : `Menyamar sebagai ${impersonation.brand.name} (domain resmi: ${impersonation.brand.domains[0]}).`);
  const suspicious = Boolean(impersonation) || findings.length >= 2;
  return { status: suspicious ? 'suspicious' : matchedDomain && findings.length === 0 ? 'safe' : 'unknown', hostname: host, matchedDomain, findings, reputation: 'unconfigured', threatTypes: [] };
}

const SENSITIVE_DATA = [
  { regex: /\b(?:otp|kode otp|one[- ]time password|kode verifikasi)\b/i, label: 'Menyebut kode OTP/verifikasi' },
  { regex: /\b(?:pin|password|sandi|kata sandi)\b/i, label: 'Menyebut PIN/password' },
  { regex: /\b(?:cvv|cvc|nomor kartu|kartu kredit|kartu debit)\b/i, label: 'Menyebut data kartu' },
  { regex: /\b(?:ktp|nik|selfie|foto ktp)\b/i, label: 'Menyebut data identitas' },
  { regex: /\b(?:token|kode akses)\b/i, label: 'Menyebut token/kode akses' }
];
const REQUEST_VERBS = /\b(?:kirim|kirimkan|berikan|sebutkan|masukkan|isi|balas|konfirmasi|verifikasi|update|perbarui|transfer|bayar|klik|buka|hubungi|scan)\b/i;
const URGENCY_WORDS = /\b(?:segera|hari ini|malam ini|24 jam|sekarang|terakhir|ditangguhkan|diblokir|dinonaktifkan|hangus|denda|penalti|terbatas)\b/i;
const LURE_WORDS = /\b(?:hadiah|menang|undian|gratis|klaim|bonus|cashback|promo|diskon|refund|subsidi|bantuan|beasiswa|lowongan|investasi|cuan|profit)\b/i;
const AUTHORITY_WORDS = /\b(?:bank|bca|bri|bni|mandiri|bjb|btn|dana|ovo|gopay|shopeepay|linkaja|pajak|dukcapil|kominfo|bpjs|pln|jne|jnt|sicepat|anteraja|pos indonesia|kurir|pengadilan|kepolisian)\b/i;
const PHONE_NUMBER = /(?:\+62|62|0)8\d{7,11}\b/;
const OBFUSCATED_BRANDS = /\b(?:g[0o]{2}gl[e3]|b[4a]nk|p[4a]yp[4a]l|f[a4]ceb[o0]{2}k|wh[a4]ts[a4]pp|1nst[a4]gr[a4]m)\b/i;
const ZERO_WIDTH = /[\u200B-\u200D\uFEFF]/;
function riskFromScore(score: number): Risk { return score >= 7 ? 'high' : score >= 3 ? 'medium' : 'low'; }
function messageAdvice(risk: Risk, sensitive: boolean) {
  if (risk === 'high') return 'Jangan klik tautan, dan jangan kirim OTP, PIN, password, atau data pribadi. Hubungi institusi lewat aplikasi atau nomor resmi.';
  if (risk === 'medium') return 'Hati-hati. Verifikasi pengirim lewat kanal resmi sebelum membalas atau membuka tautan.';
  if (sensitive) return 'Pesan menyebut data sensitif. Jangan pernah membagikan OTP/PIN kepada siapa pun.';
  return 'Tidak ada indikasi kuat, tetapi tetap waspada terhadap permintaan data pribadi.';
}

export function analyzeMessage(rawText: string): MessageResult {
  const text = rawText.trim(); const findings: Finding[] = []; const extracted = extractUrls(text); let score = 0;
  const add = (severity: Severity, message: string, points: number) => { findings.push({ severity, message }); score += points; };
  const sensitive = SENSITIVE_DATA.filter((item) => item.regex.test(text));
  const hasUrgency = URGENCY_WORDS.test(text); const hasLure = LURE_WORDS.test(text); const hasAuthority = AUTHORITY_WORDS.test(text);
  const asksAction = REQUEST_VERBS.test(text) || extracted.length > 0;
  for (const item of sensitive) add(asksAction ? 'high' : 'medium', asksAction ? `${item.label} dan meminta tindakan.` : item.label, asksAction ? 5 : 2);
  if (hasUrgency) add('medium', 'Menggunakan tekanan waktu atau ancaman.', 2);
  if (hasLure) add('medium', 'Berisi janji hadiah, keuntungan, atau bantuan.', 2);
  if (hasAuthority) add(asksAction ? 'medium' : 'low', 'Menyebut institusi, bank, atau jasa kurir tertentu.', asksAction ? 2 : 1);
  if (hasAuthority && PHONE_NUMBER.test(text) && asksAction) add('high', 'Mengaku institusi tetapi meminta kontak lewat nomor pribadi.', 3);
  if (extracted.length && (hasLure || hasUrgency)) add('medium', 'Menggabungkan tautan dengan iming-iming atau tekanan.', 2);
  if (OBFUSCATED_BRANDS.test(text)) add('medium', 'Menggunakan penulisan yang menyamarkan nama merek.', 3);
  if (ZERO_WIDTH.test(text)) add('high', 'Mengandung karakter tak terlihat (zero-width).', 4);
  const letters = text.replace(/[^A-Za-z]/g, '');
  if (letters.length >= 20 && text.replace(/[^A-Z]/g, '').length / letters.length > 0.6) add('low', 'Menggunakan huruf kapital berlebihan.', 1);
  if (/[!?]{3,}/.test(text)) add('low', 'Menggunakan tanda baca berulang.', 1);
  const urls: UrlFinding[] = extracted.map((url) => {
    try { const analyzed = analyzeUrl(url); return { url, status: analyzed.status, matchedDomain: analyzed.matchedDomain, findings: analyzed.findings }; }
    catch { return { url, status: 'unknown', matchedDomain: null, findings: ['Format tautan tidak dapat dibaca.'] }; }
  });
  for (const item of urls) {
    if (item.status === 'suspicious' || item.status === 'dangerous') {
      score += 3; findings.push({ severity: 'high', message: `Tautan memiliki indikator lokal yang mencurigakan (${item.url}).` });
    } else if (item.status === 'unknown') {
      score += 1; findings.push({ severity: 'low', message: `Domain belum ada di daftar lokal (${item.url}); ini bukan bukti berbahaya.` });
    }
  }
  const risk = riskFromScore(score);
  return { risk, score, findings, urls, advice: messageAdvice(risk, sensitive.length > 0) };
}

const QR_URL_PATTERN = /https?:\/\/[^\s<>"'`]+/i;
const stripTrailingPunctuation = (value: string) => value.replace(TRAILING_URL_PUNCTUATION, '');
function crc16Bytes(bytes: Uint8Array) {
  let crc = 0xffff;
  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit += 1) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
interface Tlv { tag: string; value: string }
function parseTlv(payload: string): Tlv[] {
  const bytes = new TextEncoder().encode(payload); const decoder = new TextDecoder('utf-8', { fatal: true }); const fields: Tlv[] = []; let offset = 0;
  while (offset < bytes.length) {
    if (offset + 4 > bytes.length) throw new Error('Struktur TLV tidak lengkap.');
    const tag = new TextDecoder().decode(bytes.subarray(offset, offset + 2));
    const lengthText = new TextDecoder().decode(bytes.subarray(offset + 2, offset + 4));
    if (!/^\d{2}$/.test(tag) || !/^\d{2}$/.test(lengthText)) throw new Error('Tag atau panjang TLV tidak valid.');
    const length = Number(lengthText); const valueStart = offset + 4; const valueEnd = valueStart + length;
    if (valueEnd > bytes.length) throw new Error('Panjang nilai TLV melebihi data.');
    try { fields.push({ tag, value: decoder.decode(bytes.subarray(valueStart, valueEnd)) }); }
    catch { throw new Error('Isi QR mengandung teks yang tidak valid.'); }
    offset = valueEnd;
  }
  return fields;
}
function validateCrc(payload: string) {
  const bytes = new TextEncoder().encode(payload); const marker = new TextEncoder().encode('6304'); let index = -1;
  for (let i = 0; i <= bytes.length - marker.length; i += 1) if (marker.every((byte, j) => bytes[i + j] === byte)) index = i;
  if (index < 0) return { valid: false, expected: null, actual: null };
  const actual = new TextDecoder().decode(bytes.subarray(index + 4, index + 8)).toUpperCase();
  if (!/^[0-9A-F]{4}$/.test(actual)) return { valid: false, expected: null, actual };
  const expected = crc16Bytes(bytes.subarray(0, index + 4));
  return { valid: expected === actual, expected, actual };
}
function isQrisCandidate(content: string) {
  if (content.startsWith('000201')) return true;
  if (!content.includes('6304')) return false;
  try { return parseTlv(content).some((field) => field.tag === '00' && field.value === '01'); } catch { return false; }
}
function riskFinding(severity: Severity, message: string): Finding { return { severity, message }; }
function analyzeWifi(content: string): QrResult {
  const body = content.replace(/^WIFI:/i, ''); const fields: Record<string, string> = {};
  for (const part of body.split(';')) { const separator = part.indexOf(':'); if (separator !== -1) fields[part.slice(0, separator).toUpperCase()] = part.slice(separator + 1); }
  const security = (fields.T ?? '').toLowerCase(); const hidden = fields.H === 'true'; const findings: Finding[] = []; let score = 0;
  if (!security || security === 'nopass') { findings.push(riskFinding('medium', 'Jaringan Wi-Fi terbuka tanpa password.')); score += 2; }
  if (hidden) { findings.push(riskFinding('low', 'Jaringan Wi-Fi disembunyikan.')); score += 1; }
  return { type: 'wifi', risk: score >= 2 ? 'medium' : 'low', score, findings, urls: [], qris: null, wifi: { ssid: fields.S ?? null, security: security || null, hidden } };
}
function analyzeQris(content: string): QrResult {
  const fields = parseTlv(content); const values: Record<string, string> = {}; const counts = new Map<string, number>(); const findings: Finding[] = []; let score = 0;
  const add = (severity: Severity, message: string, points: number) => { findings.push(riskFinding(severity, message)); score += points; };
  for (const { tag, value } of fields) { counts.set(tag, (counts.get(tag) ?? 0) + 1); if (!(tag in values)) values[tag] = value; }
  if (values['00'] !== '01') add('high', 'Payload format indicator QRIS bukan 01.', 5);
  for (const [tag, count] of counts) if (count > 1) add('medium', `Tag QRIS ${tag} muncul lebih dari sekali.`, 2);
  const crc = validateCrc(content); if (!crc.valid) add('high', 'CRC QRIS tidak valid; data bisa rusak atau dimanipulasi.', 5);
  const currency = values['53'] ?? null; if (currency && currency !== '360') add('high', `Mata uang QRIS bukan IDR (${currency}).`, 5);
  const country = values['58'] ?? null; if (country && country !== 'ID') add('medium', `Negara merchant bukan Indonesia (${country}).`, 2);
  const amountRaw = values['54'] ?? null; const amount = amountRaw && /^\d+(?:\.\d+)?$/.test(amountRaw) ? Number(amountRaw) : null;
  if (amountRaw && amount === null) add('medium', 'Nominal QRIS tidak berformat angka yang valid.', 2);
  const mode = values['01'] === '12' ? 'dynamic' : 'static';
  if (mode === 'dynamic' && amount === null) add('medium', 'QRIS dinamis tidak mencantumkan nominal.', 2);
  if (mode === 'static' && amount !== null) add('medium', 'QRIS statis mencantumkan nominal; periksa kembali.', 2);
  if (!values['59']) add('medium', 'Nama merchant tidak tercantum.', 2);
  const merchantAccounts = fields.filter((field) => Number(field.tag) >= 26 && Number(field.tag) <= 51).map((field) => {
    try { const subValues: Record<string, string> = {}; for (const sub of parseTlv(field.value)) if (!(sub.tag in subValues)) subValues[sub.tag] = sub.value; return { tag: field.tag, guid: subValues['00'] ?? null, merchantId: subValues['02'] ?? null }; }
    catch { return { tag: field.tag, guid: null, merchantId: null }; }
  });
  if (!merchantAccounts.length) add('medium', 'Informasi akun merchant tidak ditemukan.', 2);
  return { type: 'qris', risk: score >= 5 ? 'high' : score >= 2 ? 'medium' : 'low', score, findings, urls: [], qris: { mode, merchantName: values['59'] ?? null, city: values['60'] ?? null, country, currency: currency === '360' ? 'IDR' : currency, amount, amountRaw, mcc: values['52'] ?? null, crcValid: crc.valid, crcExpected: crc.expected, crcActual: crc.actual, merchantAccounts } };
}
function qrAdvice(type: string, risk: Risk) {
  if (type === 'qris') return risk === 'high' ? 'Jangan bayar. Data QRIS tidak lolos validasi. Minta QR baru dari merchant lewat kanal resmi.' : 'Cocokkan nama merchant dan nominal dengan yang tertera di aplikasi sebelum membayar. CRC valid bukan jaminan merchant resmi.';
  if (type === 'url') return 'Periksa domain secara teliti. Pemeriksaan lokal tidak mencakup daftar reputasi keamanan terkini.';
  if (type === 'wifi') return 'Pastikan nama jaringan sesuai dengan informasi resmi tempat tersebut sebelum terhubung.';
  return 'Periksa isi kode dan pastikan kamu memahami tindakan yang akan dilakukan sebelum melanjutkan.';
}

export function analyzeQrContent(rawContent: string): QrResult {
  const content = rawContent.trim(); const urlMatch = content.match(QR_URL_PATTERN); const isQris = isQrisCandidate(content);
  if (/^https?:\/\//i.test(content) || (urlMatch && !isQris)) {
    const url = stripTrailingPunctuation(/^https?:\/\//i.test(content) ? content : urlMatch![0]);
    let result: LinkResult | null = null; try { result = analyzeUrl(url); } catch { /* shown below as unrecognized local input */ }
    const risk: Risk = result?.status === 'suspicious' ? 'high' : result?.status === 'unknown' ? 'low' : 'low';
    const findings = result?.findings.map((message) => riskFinding(result!.status === 'suspicious' ? 'high' : 'low', message)) ?? [];
    if (result?.status === 'unknown') findings.push(riskFinding('low', 'Domain belum ada di daftar lokal; ini bukan bukti tautan aman atau berbahaya.'));
    const urls = [{ url, status: result?.status ?? 'unknown', matchedDomain: result?.matchedDomain ?? null, findings: result?.findings ?? ['Format tautan tidak dapat dibaca.'] }];
    return { type: 'url', risk, score: risk === 'high' ? 5 : 0, findings, urls, qris: null, advice: qrAdvice('url', risk) };
  }
  if (isQris) {
    try { const result = analyzeQris(content); return { ...result, advice: qrAdvice('qris', result.risk) }; }
    catch (error) { const message = error instanceof Error ? error.message : 'Data QRIS tidak valid.'; return { type: 'qris', risk: 'high', score: 5, findings: [riskFinding('high', `Struktur QRIS tidak valid: ${message}`)], urls: [], qris: null, advice: qrAdvice('qris', 'high') }; }
  }
  if (/^WIFI:/i.test(content)) { const result = analyzeWifi(content); return { ...result, advice: qrAdvice('wifi', result.risk) }; }
  const known: Record<string, { type: string; findings?: Finding[] }> = {
    'BEGIN:VCARD': { type: 'vcard' }, SMSTO: { type: 'sms', findings: [riskFinding('low', 'QR berisi perintah SMS; periksa nomor tujuan sebelum mengirim.')] },
    'TEL:': { type: 'tel' }, 'MAILTO:': { type: 'email' }, 'GEO:': { type: 'location' }
  };
  const prefix = Object.keys(known).find((key) => content.toUpperCase().startsWith(key)); const item = prefix ? known[prefix] : { type: 'text' };
  return { type: item.type, risk: 'low', score: 0, findings: item.findings ?? [], urls: [], qris: null, advice: qrAdvice(item.type, 'low') };
}
