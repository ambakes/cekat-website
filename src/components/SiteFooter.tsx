import type { PageKind } from '../config';
import { Brand } from './Brand';

export function SiteFooter({ page }: { page: PageKind }) {
  const prefix = page === 'home' ? '' : 'index.html';
  return (
    <footer className="site-footer">
      <div className="wrap footer-inner">
        <div className="footer-brand"><Brand /><p>Periksa dulu, baru percaya.</p></div>
        <nav className="footer-links" aria-label="Navigasi tambahan">
          <a href={`${prefix}#periksa`}>Periksa</a><a href={`${prefix}#pola`}>Pola</a><a href={`${prefix}#latihan`}>Latihan</a><a href="alat.html">Edukasi</a><a href={`${prefix}#bantuan`}>Darurat</a>
        </nav>
        <p className="footer-note">Prototipe edukasi. Hasil pemeriksaan berupa indikasi, bukan vonis.</p>
      </div>
    </footer>
  );
}
