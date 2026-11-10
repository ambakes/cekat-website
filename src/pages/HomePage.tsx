import { useState } from 'react';
import { EmergencyDialog } from '../components/EmergencyDialog';
import { HeroScene } from '../components/HeroScene';
import { Icon } from '../components/Icon';
import { CheckTools } from '../features/checker/CheckTools';
import { Practice } from '../features/practice/Practice';

const patterns = [
  { id: 'phishing', title: 'Phishing', description: 'Tautan yang menyamar sebagai bank, kurir, atau toko untuk mencuri kata sandi dan OTP.', alt: 'Simulasi situs paket palsu dengan permintaan kode akses.' },
  { id: 'otp', title: 'Kode OTP', description: 'Kode sekali pakai tidak boleh dibagikan, bahkan ke orang yang mengaku keluarga.', alt: 'Simulasi pesan meminta OTP dan balasan yang menolak membagikannya.' },
  { id: 'qris', title: 'QRIS palsu', description: 'Stiker QR di meja bisa ditukar. Selalu cocokkan nama penerima sebelum membayar.', alt: 'Simulasi nama warung dan penerima QRIS yang berbeda.' }
] as const;

export function HomePage() {
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  return (
    <>
      <main id="konten">
        <section className="hero" aria-labelledby="hero-title">
          <HeroScene />
          <div className="wrap hero-inner">
            <h1 id="hero-title">Ada yang terasa janggal?<br /><span>Periksa dulu.</span></h1>
            <p className="hero-lede">Periksa tautan, pesan, dan kode QR. Kenali pola penipuan sebelum mengambil tindakan.</p>
            <div className="hero-actions"><a className="btn btn-primary" href="#periksa">Periksa sekarang</a><a className="text-link" href="alat.html">Baca edukasi <Icon name="arrow" /></a></div>
          </div>
        </section>
        <CheckTools />
        <section className="section patterns" id="pola" aria-labelledby="pola-title">
          <div className="wrap">
            <div className="section-head section-head--center"><h2 id="pola-title">Tiga pola yang paling sering datang.</h2><p>Kenali tandanya sebelum mengambil tindakan.</p></div>
            <div className="pattern-grid">{patterns.map((pattern) => <a key={pattern.id} className="pattern-card" href={`alat.html#${pattern.id}`}><img className="simulation-thumb" src={`/assets/simulasi/${pattern.id}.svg`} width="600" height="360" loading="lazy" decoding="async" alt={pattern.alt} /><h3>{pattern.title}</h3><p>{pattern.description}</p><span className="card-link">Pelajari <Icon name="arrow" /></span></a>)}</div>
            <p className="pattern-more">Ada juga <a href="alat.html#hadiah">hadiah palsu</a>, <a href="alat.html#akun">akun tiruan</a>, dan <a href="#bantuan">uang terlanjur dikirim</a>.</p>
          </div>
        </section>
        <Practice />
        <section className="emergency" id="bantuan" aria-labelledby="bantuan-title"><div className="wrap emergency-inner"><div><h2 id="bantuan-title">Kalau uang sudah terlanjur dikirim.</h2><p>Jangan tunggu. Hubungi bank lewat kanal resmi dan simpan bukti transaksi.</p></div><button className="btn btn-primary" type="button" onClick={() => setEmergencyOpen(true)}>Buka langkah darurat</button></div></section>
      </main>
      <EmergencyDialog open={emergencyOpen} onClose={() => setEmergencyOpen(false)} />
    </>
  );
}
