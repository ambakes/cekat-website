import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { ECGWaveform } from '../../components/ECGWaveform';
import { Icon } from '../../components/Icon';
import { checkMessage, checkQr, checkUrlWithGoogleSafeBrowsing } from './api';
import type { Finding, LinkResult, MessageResult, QrResult, UrlFinding } from './analyzers';

type Tool = 'link' | 'message' | 'qr';
type Result = LinkResult | MessageResult | QrResult;
const tools: { id: Tool; label: string; title: string; description: string; icon: 'link' | 'message' | 'qr' }[] = [
  { id: 'link', label: 'Tautan', title: 'Periksa tautan', description: 'Kirim URL ke Google Safe Browsing dan periksa pola domain yang mencurigakan.', icon: 'link' },
  { id: 'message', label: 'Pesan', title: 'Periksa pesan', description: 'Kirim SMS atau chat ke IsThisSpam untuk mendapatkan klasifikasi dan alasannya.', icon: 'message' },
  { id: 'qr', label: 'QR / QRIS', title: 'Periksa kode QR', description: 'Tempel isi hasil pindai atau unggah gambar kode QR untuk diperiksa.', icon: 'qr' }
];
const riskLabels = { low: 'Risiko rendah', medium: 'Risiko sedang', high: 'Risiko tinggi' } as const;
const statusLabels = { safe: 'aman', suspicious: 'mencurigakan', dangerous: 'berbahaya', unknown: 'belum diketahui' } as const;
const typeLabels: Record<string, string> = { qris: 'QRIS (pembayaran)', url: 'Tautan', wifi: 'Jaringan Wi-Fi', vcard: 'Kontak (vCard)', sms: 'Perintah SMS', tel: 'Nomor telepon', email: 'Alamat email', location: 'Lokasi', text: 'Teks biasa' };
const externalLabels: Record<string, string> = { Legitimate: 'Wajar', Spam: 'Spam', Phishing: 'Phishing', Scam: 'Penipuan' };

declare global {
  interface Window {
    jsQR?: (data: Uint8ClampedArray, width: number, height: number, options?: { inversionAttempts?: string }) => { data: string } | null;
  }
}

async function decodeQrImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Pilih berkas gambar.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Ukuran gambar maksimal 5 MB.');
  if (!window.jsQR) throw new Error('Decoder QR belum termuat. Muat ulang halaman lalu coba lagi.');
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Gambar tidak dapat dibaca.'));
    });
    let width = image.naturalWidth || image.width;
    let height = image.naturalHeight || image.height;
    const scale = Math.min(1, 2000 / Math.max(width, height));
    width = Math.round(width * scale); height = Math.round(height * scale);
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Gambar tidak dapat diproses di peramban ini.');
    context.drawImage(image, 0, 0, width, height);
    const decoded = window.jsQR(context.getImageData(0, 0, width, height).data, width, height, { inversionAttempts: 'attemptBoth' });
    if (!decoded?.data) throw new Error('QR tidak terbaca. Pastikan gambar jelas dan tidak terpotong.');
    return decoded.data;
  } finally { URL.revokeObjectURL(objectUrl); }
}

function ResultPanel({ result, tool }: { result: Result; tool: Tool }) {
  const risk = 'risk' in result ? result.risk : null;
  const score = 'score' in result ? result.score : null;
  const status = 'status' in result ? result.status : null;
  const qr = 'type' in result ? result as QrResult : null;
  const link = 'hostname' in result ? result as LinkResult : null;
  const title = qr ? riskLabels[qr.risk]
    : link?.reputation === 'threat_detected' ? 'Google Safe Browsing menemukan potensi ancaman'
      : link?.reputation === 'unavailable' ? 'Pemeriksaan Google Safe Browsing gagal'
        : link?.reputation === 'unconfigured' ? 'Hasil analisis pola lokal'
          : risk ? riskLabels[risk] : status ? ({ safe: 'Tidak terdeteksi di Google Safe Browsing', dangerous: 'Berpotensi berbahaya', suspicious: 'Mencurigakan — perlu diperiksa', unknown: 'Belum bisa dipastikan' } as const)[status] : 'Hasil pemeriksaan';
  const findings: (Finding | string)[] = 'findings' in result ? result.findings as (Finding | string)[] : [];
  const urls: UrlFinding[] = 'urls' in result ? result.urls ?? [] : [];
  const external = 'external' in result ? result.external : null;
  const advice = 'advice' in result ? result.advice : undefined;
  const registeredAs = link?.matchedDomain && link.matchedDomain !== link.hostname ? ` (terdaftar sebagai ${link.matchedDomain})` : '';
  const amount = qr?.qris?.amount;
  const amountText = amount == null ? 'Tidak dicantumkan' : qr?.qris?.currency === 'IDR'
    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 2 }).format(amount)
    : `${amount} ${qr?.qris?.currency ?? ''}`.trim();
  const details = qr?.type === 'qris' && qr.qris ? [
    ['Merchant', qr.qris.merchantName], ['Kota', qr.qris.city], ['Nominal', amountText],
    ['Mode', qr.qris.mode === 'dynamic' ? 'Dinamis' : 'Statis'], ['Mata uang', qr.qris.currency], ['Negara', qr.qris.country], ['MCC', qr.qris.mcc],
    ['CRC', qr.qris.crcValid ? `Valid (${qr.qris.crcActual ?? '-'})` : `Tidak valid (${qr.qris.crcActual ?? '-'}; seharusnya ${qr.qris.crcExpected ?? '-'})`],
    ['GUID merchant', qr.qris.merchantAccounts?.map((account) => account.guid).filter(Boolean).join(', ')]
  ] : qr?.type === 'wifi' && qr.wifi ? [['SSID', qr.wifi.ssid], ['Keamanan', qr.wifi.security], ['Jaringan tersembunyi', qr.wifi.hidden ? 'Ya' : 'Tidak']] : [];

  return <div className={`result api-result ${risk === 'high' || status === 'dangerous' ? 'warning' : risk === 'medium' || status === 'suspicious' ? 'caution' : ''}`} role="status" aria-live="polite">
    <div className="result-head"><span className="result-symbol" aria-hidden="true">{risk === 'high' || link?.reputation === 'threat_detected' || status === 'dangerous' ? '!' : '·'}</span><div className="api-result-heading"><p className="result-title">{title}</p>{link && <p className="api-result-meta">Domain: <code>{link.hostname}</code>{registeredAs}</p>}{qr && score !== null && <p className="api-result-meta">Jenis: {typeLabels[qr.type] ?? qr.type} · Skor indikasi: {score}</p>}{risk && tool === 'message' && score !== null && <p className="api-result-meta">Skor indikasi: {score}</p>}</div><span className="stamp result-stamp">{risk ? 'Indikasi' : link?.reputation === 'threat_detected' ? 'Potensi ancaman' : link?.reputation === 'no_known_threat' ? 'Tak terdeteksi' : status === 'dangerous' ? 'Waspada' : status === 'safe' ? 'Periksa' : 'Periksa'}</span></div>
    {link && <p className="api-result-meta">{link.reputation === 'threat_detected' ? `Google Safe Browsing mengidentifikasi potensi ancaman (${link.threatTypes.join(', ') || 'jenis tidak disebutkan'}).` : link.reputation === 'no_known_threat' ? 'Google Safe Browsing tidak menemukan ancaman yang dikenal pada URL ini.' : link.reputation === 'unavailable' ? link.error || 'Google Safe Browsing tidak dapat dihubungi; indikator lokal tetap ditampilkan.' : 'Google Safe Browsing belum dikonfigurasi; hasil hanya memakai indikator lokal.'}{link.matchedDomain ? ` Domain juga cocok dengan daftar lokal (${link.matchedDomain}).` : ''}</p>}
    <ul className="api-findings">{findings.length ? findings.map((finding, index) => typeof finding === 'string' ? <li key={`info-${index}`}>{finding}</li> : <li key={`${finding.severity}-${index}`}><span className={`badge badge-${finding.severity}`}>{({ low: 'Rendah', medium: 'Sedang', high: 'Tinggi' } as const)[finding.severity]}</span> {finding.message}</li>) : <li>Tidak ada pola menonjol yang ditemukan.</li>}</ul>
    {details.length > 0 && <dl className="api-details">{details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Tidak tercantum'}</dd></div>)}</dl>}
    {urls.length > 0 && <div className="api-url-results"><h4>{tool === 'qr' ? 'Tautan di dalam QR' : 'Tautan yang ditemukan'}</h4><ul>{urls.map((item, index) => <li key={`${item.url}-${index}`}><code>{item.url}</code><span> — {statusLabels[item.status] ?? item.status}{item.reputation === 'unavailable' ? ' (layanan reputasi tidak tersedia)' : ''}</span></li>)}</ul></div>}
    {external && <div className="api-external"><h4>Pemeriksaan IsThisSpam</h4>{external.available ? <><p className={external.isSpam ? 'risk-high' : 'risk-low'}>{externalLabels[external.classification ?? ''] ?? external.classification ?? 'Tidak diketahui'}: {external.isSpam ? 'terindikasi berbahaya' : 'tidak terindikasi berbahaya'}{typeof external.confidence === 'number' ? ` · keyakinan ${Math.round(external.confidence * 100)}%` : ''}</p>{external.reasons?.length ? <ul>{external.reasons.map((reason, index) => <li key={index}>{reason}</li>)}</ul> : null}{external.recommendations?.length ? <p>Saran IsThisSpam: {external.recommendations.join(' ')}</p> : null}</> : <p>{external.error || 'Klasifikasi tidak tersedia.'}</p>}</div>}
    {advice && <p className="api-advice">{advice}</p>}
    {tool === 'link' && <p className="api-note">Pemeriksaan menggunakan Google Safe Browsing; hasil dan keakuratannya tidak dijamin. Pelajari <a href="https://antiphishing.org/" target="_blank" rel="noreferrer">peringatan phishing</a> dan <a href="https://developers.google.com/search/docs/monitor-debug/security/malware" target="_blank" rel="noreferrer">peringatan malware</a>.</p>}
    {tool === 'qr' && <p className="api-note">Hasil ini hanya indikasi. Cocokkan nama penerima dan nominal melalui aplikasi resmi sebelum memasukkan PIN.</p>}
  </div>;
}

export function CheckTools() {
  const [active, setActive] = useState<Tool>('link');
  const [value, setValue] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => () => request.current?.abort(), []);
  const selectTool = (tool: Tool) => {
    request.current?.abort(); setActive(tool); setValue(''); setFile(null); setResult(null); setError(''); setBusy(false);
    if (fileInput.current) fileInput.current.value = '';
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setBusy(true); setError(''); setResult(null);
    try {
      let content = value.trim();
      if (active === 'qr' && file) {
        content = await decodeQrImage(file);
        setValue(content);
      }
      if (!content) throw new Error(active === 'qr' ? 'Tempel isi QR atau pilih gambar QR.' : 'Isi pemeriksaan wajib diisi.');
      const data = active === 'link' ? await checkUrlWithGoogleSafeBrowsing(content, controller.signal)
        : active === 'message' ? await checkMessage(content, controller.signal)
          : await checkQr(content, controller.signal);
      if (!controller.signal.aborted) setResult(data);
    } catch (caught) {
      if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : 'Pemeriksaan tidak berhasil.');
    } finally { if (!controller.signal.aborted) setBusy(false); }
  };
  const activeTool = tools.find((tool) => tool.id === active)!;
  const handleTabKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    const current = tools.findIndex((tool) => tool.id === active);
    const next = event.key === 'ArrowRight' ? (current + 1) % tools.length
      : event.key === 'ArrowLeft' ? (current + tools.length - 1) % tools.length
        : event.key === 'Home' ? 0 : event.key === 'End' ? tools.length - 1 : -1;
    if (next < 0) return;
    event.preventDefault();
    const tool = tools[next];
    selectTool(tool.id);
    document.getElementById(`tool-tab-${tool.id}`)?.focus();
  };
  const placeholder = active === 'link' ? 'https://contoh.com' : active === 'message' ? 'Tempel isi SMS, WhatsApp, atau chat yang mencurigakan…' : 'Tempel isi hasil pindai QR atau QRIS…';
  return <section className="checker" id="periksa" aria-labelledby="periksa-title"><div className="wrap">
    <div className="section-head"><img className="checker-illustration" src="/assets/checker-inspect.svg" width="320" height="200" loading="lazy" decoding="async" alt="" aria-hidden="true"/><h2 id="periksa-title">Meja periksa</h2><p>Periksa tautan, pesan, atau kode QR sebelum kamu mengambil tindakan.</p></div>
    <div className="tool-card"><div className="tool-topbar"><h3 className="qris-tool-title"><Icon name={activeTool.icon}/>{activeTool.title}</h3><ECGWaveform/></div>
      <div className="checker-tabs" role="tablist" aria-label="Pilih jenis pemeriksaan">{tools.map((tool) => <button key={tool.id} type="button" role="tab" id={`tool-tab-${tool.id}`} aria-selected={active === tool.id} aria-controls="tool-panel" className={`checker-tab${active === tool.id ? ' is-active' : ''}`} tabIndex={active === tool.id ? 0 : -1} onKeyDown={handleTabKey} onClick={() => selectTool(tool.id)}><Icon name={tool.icon}/>{tool.label}</button>)}</div>
      <div role="tabpanel" id="tool-panel" aria-labelledby={`tool-tab-${active}`}><p className="tool-description">{activeTool.description}</p><form onSubmit={(event) => void submit(event)}>
        <label className="tool-label" htmlFor="check-content">{active === 'link' ? 'URL yang ingin diperiksa' : active === 'message' ? 'Isi pesan' : 'Isi hasil pindai QR / QRIS'}</label>
        <textarea className="tool-input" id="check-content" rows={active === 'link' ? 2 : 5} value={value} maxLength={active === 'link' ? 2048 : active === 'message' ? 10000 : 4096} required={active !== 'qr' || !file} spellCheck={active === 'message'} autoCapitalize="off" autoCorrect="off" placeholder={placeholder} onChange={(event) => { setValue(event.target.value); setResult(null); setError(''); }}/>
        {active === 'qr' && <div className="qr-upload"><label className="tool-label" htmlFor="qr-image">Atau unggah gambar QR (maksimal 5 MB)</label><input ref={fileInput} id="qr-image" type="file" accept="image/*" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setResult(null); setError(''); }}/>{file && <span className="qr-file-name">{file.name}</span>}</div>}
        <div className="tool-footer"><p className="tool-hint">{active === 'message' ? 'Isi pesan dikirim ke IsThisSpam. Jangan kirim OTP, kata sandi, atau data pribadi.' : active === 'link' ? 'URL dikirim ke Google Safe Browsing; hasilnya bukan jaminan keamanan dan API ini ditujukan untuk penggunaan nonkomersial. Hindari URL bertoken privat.' : 'Isi QR dikirim untuk dianalisis. QR berisi tautan juga diperiksa lewat Google Safe Browsing dan IsThisSpam.'}</p><button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Memeriksa…' : activeTool.title}<Icon name="search"/></button></div>
      </form></div>
      {error && <p className="api-error" role="alert">{error}</p>}{result && <ResultPanel result={result} tool={active} />}
      <p className="api-privacy">Isi QR yang ditempel dan hasil dekode gambar dikirim ke layanan pemeriksaan proyek. QR yang berisi tautan dapat diteruskan ke Google Safe Browsing dan IsThisSpam. Hindari memindai QR yang memuat informasi rahasia.</p>
    </div>
  </div></section>;
}
