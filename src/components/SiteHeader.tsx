import { useEffect, useRef, useState } from 'react';
import { BREAKPOINTS } from '../config';
import type { PageKind } from '../config';
import { useDismissable } from '../hooks/useDismissable';
import { usePreferences } from '../hooks/usePreferences';
import { Brand } from './Brand';
import { Icon } from './Icon';

export function SiteHeader({ page }: { page: PageKind }) {
  const [open, setOpen] = useState(false);
  const nav = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const { theme, setTheme } = usePreferences();
  const prefix = page === 'home' ? '' : 'index.html';
  const themeLabel = theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap';
  useDismissable(open, nav, trigger, () => setOpen(false));

  useEffect(() => {
    document.body.classList.toggle('menu-open', open);
    if (open) nav.current?.querySelector<HTMLAnchorElement>('a')?.focus({ preventScroll: true });
    return () => document.body.classList.remove('menu-open');
  }, [open]);
  useEffect(() => {
    const desktop = window.matchMedia(`(min-width: ${BREAKPOINTS.menu + 1}px)`);
    const update = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener('change', update);
    return () => desktop.removeEventListener('change', update);
  }, []);

  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <Brand />
        <nav ref={nav} className={`main-nav${open ? ' open' : ''}`} id="main-nav" aria-label="Navigasi utama" onClick={() => setOpen(false)}>
          <a href={`${prefix}#periksa`} aria-current={page === 'home' ? 'page' : undefined}>Periksa</a>
          <a href={`${prefix}#pola`}>Pola</a>
          <a href={`${prefix}#latihan`}>Latihan</a>
          <a href="alat.html" aria-current={page === 'education' ? 'page' : undefined}>Edukasi</a>
        </nav>
        <div className="header-actions">
          <button className="theme-toggle" type="button" aria-label={themeLabel} title={themeLabel} aria-pressed={theme === 'light'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            <svg className="icon theme-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></svg>
            <svg className="icon theme-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z" /></svg>
          </button>
          <a className="btn btn-primary btn-small" href={`${prefix}#periksa`}>Periksa</a>
          <button ref={trigger} className="menu-btn" type="button" aria-controls="main-nav" aria-expanded={open} aria-label={open ? 'Tutup menu' : 'Buka menu'} onClick={() => setOpen(!open)}><Icon name={open ? 'close' : 'menu'} /></button>
        </div>
      </div>
    </header>
  );
}
