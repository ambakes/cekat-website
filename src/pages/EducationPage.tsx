import { useRef } from 'react';
import { HeroScene } from '../components/HeroScene';
import { Icon } from '../components/Icon';
import { educationChapters } from '../features/education/chapters';
import { useReadingProgress } from '../features/education/useReadingProgress';

export function EducationPage() {
  const content = useRef<HTMLDivElement>(null);
  const { progress, activeId, resumeId, showJump } = useReadingProgress(content);
  const resumeIndex = educationChapters.findIndex((chapter) => chapter.id === resumeId);
  const percent = progress >= .995 ? 'Selesai' : `${Math.round(progress * 100)}%`;
  return (
    <>
      <main id="konten">
        <section className="book-hero" aria-labelledby="book-title">
          <HeroScene />
          <div className="wrap"><h1 id="book-title">Kenali polanya,<br /><span>sebelum percaya.</span></h1><p className="lede">Enam situasi singkat, tanpa istilah teknis.</p>
            <div className="book-hero-actions"><a className="btn btn-primary" href="#phishing">Mulai membaca</a><a className="text-link" href="index.html#periksa">Buka meja periksa <Icon name="arrow" /></a></div>
            {resumeIndex >= 0 && <a className="book-resume" href={`#${resumeId}`}><span className="book-resume-kicker">Lanjutkan</span><strong>Bab {String(resumeIndex + 1).padStart(2, '0')} · {educationChapters[resumeIndex].title}</strong><Icon name="arrow" /></a>}
          </div>
        </section>
        <div className="book-progress" aria-hidden="true"><span style={{ transform: `scaleX(${progress})` }} /></div>
        <div className="wrap book-layout">
          <aside className="book-index" id="daftar-isi" aria-label="Daftar isi edukasi"><img className="book-character" src="/assets/characters/fox.svg" width="224" height="160" loading="lazy" decoding="async" alt="" aria-hidden="true" /><div className="book-index-head"><p className="book-index-title">Daftar isi</p><span className="book-index-percent" aria-hidden="true">{percent}</span></div><nav>{educationChapters.map((chapter, index) => <a key={chapter.id} href={`#${chapter.id}`} className={activeId === chapter.id ? 'active' : undefined} aria-current={activeId === chapter.id ? 'location' : undefined}><span>{String(index + 1).padStart(2, '0')}</span> {chapter.title}</a>)}</nav></aside>
          <div ref={content} className="book-content">{educationChapters.map((chapter, index) => {
            const next = educationChapters[(index + 1) % educationChapters.length];
            return <article key={chapter.id} className="book-topic" id={chapter.id} aria-labelledby={`${chapter.id}-title`}>
              <header className="topic-head"><span className="topic-num" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><h2 id={`${chapter.id}-title`}>{chapter.title}</h2></header>
              <p className="topic-lede">{chapter.summary}</p>
              {chapter.illustration && <figure className="simulation-figure"><img src={chapter.illustration.src} width="600" height="360" loading="lazy" decoding="async" alt={chapter.illustration.alt} /><figcaption>{chapter.illustration.caption}</figcaption></figure>}
              <ul className="topic-points">{chapter.points.map((point) => <li key={point}>{point}</li>)}</ul>
              <p className="topic-takeaway"><span>Intinya</span>{chapter.takeaway}</p>
              <a className="topic-next" href={`#${next.id}`}>{index === educationChapters.length - 1 ? 'Baca ulang dari awal' : `Bab berikutnya: ${next.title}`}<Icon name="arrow" /></a>
            </article>;
          })}</div>
        </div>
        <div className="wrap"><div className="book-footnote" id="catatan"><strong>Catatan.</strong> Tautan yang diperiksa dikirim ke Google Safe Browsing dan pesan ke IsThisSpam. Hasil berupa indikasi, bukan jaminan keamanan. Gambar QR diproses lokal di browser. Hindari memasukkan OTP, kata sandi, atau data rahasia.</div></div>
      </main>
      {showJump && <a className="book-jump" href="#daftar-isi">Daftar isi</a>}
    </>
  );
}
