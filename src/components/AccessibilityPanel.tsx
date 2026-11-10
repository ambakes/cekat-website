import { useEffect, useRef, useState } from 'react';
import { useDismissable } from '../hooks/useDismissable';
import { usePreferences } from '../hooks/usePreferences';
import type { TextSize } from '../types/preferences';
import { Icon } from './Icon';

const textOptions: readonly { value: TextSize; label: string }[] = [
  { value: 'normal', label: 'Normal' }, { value: 'lg', label: 'Besar' }, { value: 'xl', label: 'Sangat besar' }
];

export function AccessibilityPanel() {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const { accessibility, updateAccessibility, resetAccessibility } = usePreferences();
  useDismissable(open, panel, trigger, () => setOpen(false));
  useEffect(() => { if (open) close.current?.focus({ preventScroll: true }); }, [open]);
  const switches = [
    { key: 'contrast', label: 'Kontras tinggi', hint: 'Teks lebih tegas dan mudah dibaca' },
    { key: 'motion', label: 'Kurangi animasi', hint: 'Hentikan gerakan dan transisi' },
    { key: 'underline', label: 'Garis bawah tautan', hint: 'Bedakan tautan tanpa mengandalkan warna' }
  ] as const;

  return (
    <div className="a11y">
      <button ref={trigger} className="a11y-fab" type="button" aria-expanded={open} aria-controls="a11y-panel" aria-label={open ? 'Tutup menu aksesibilitas' : 'Buka menu aksesibilitas'} onClick={() => setOpen(!open)}><Icon name="access" /><span className="a11y-fab-label">Aksesibilitas</span></button>
      <div ref={panel} className="a11y-panel" id="a11y-panel" role="dialog" aria-labelledby="a11y-title" hidden={!open}>
        <div className="a11y-head">
          <div><p className="a11y-kicker">Atur tampilan</p><h2 id="a11y-title">Aksesibilitas</h2></div>
          <button ref={close} className="a11y-close" type="button" aria-label="Tutup menu aksesibilitas" onClick={() => { setOpen(false); trigger.current?.focus({ preventScroll: true }); }}><Icon name="close" /></button>
        </div>
        <fieldset className="a11y-group"><legend>Ukuran teks</legend><div className="a11y-seg">{textOptions.map(({ value, label }) => <button key={value} type="button" aria-pressed={accessibility.text === value} onClick={() => updateAccessibility({ text: value })}>{label}</button>)}</div></fieldset>
        <div className="a11y-group a11y-switches">{switches.map(({ key, label, hint }) => (
          <button key={key} className="a11y-switch" type="button" aria-pressed={accessibility[key]} onClick={() => updateAccessibility({ [key]: !accessibility[key] })}>
            <span className="a11y-switch-copy"><strong>{label}</strong><small>{hint}</small></span><span className="a11y-switch-track" aria-hidden="true" />
          </button>
        ))}</div>
        <div className="a11y-foot"><button className="a11y-reset" type="button" onClick={resetAccessibility}>Atur ulang</button><p>Pengaturan tersimpan<br />di perangkat ini.</p></div>
      </div>
    </div>
  );
}
