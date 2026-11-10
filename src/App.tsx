import { useEffect } from 'react';
import type { PageKind } from './config';
import { PreferencesProvider } from './providers/PreferencesProvider';
import { AccessibilityPanel } from './components/AccessibilityPanel';
import { IconSymbols } from './components/IconSymbols';
import { SiteHeader } from './components/SiteHeader';
import { SiteFooter } from './components/SiteFooter';
import { HomePage } from './pages/HomePage';
import { EducationPage } from './pages/EducationPage';

export function App({ page }: { page: PageKind }) {
  useEffect(() => {
    if (!window.location.hash) return;
    let id: string;
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
    const frame = window.requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }));
    return () => window.cancelAnimationFrame(frame);
  }, [page]);
  return (
    <PreferencesProvider>
      <a className="skip-link" href="#konten">Lewati ke konten</a>
      <IconSymbols />
      <SiteHeader page={page} />
      {page === 'education' ? <EducationPage /> : <HomePage />}
      <SiteFooter page={page} />
      <AccessibilityPanel />
    </PreferencesProvider>
  );
}
