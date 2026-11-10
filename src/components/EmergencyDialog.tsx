import { useEffect, useRef } from 'react';
import { Icon } from './Icon';

export function EmergencyDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      if (typeof element.showModal === 'function') element.showModal();
      else element.setAttribute('open', '');
    } else if (!open && element.open) {
      if (typeof element.close === 'function') element.close();
      else element.removeAttribute('open');
    }
    return () => { if (element.open && typeof element.close === 'function') element.close(); };
  }, [open]);

  return (
    <dialog ref={dialog} id="panic-dialog" aria-labelledby="panic-title" onClose={onClose} onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="dialog-head"><h2 id="panic-title">Langkah kalau sudah terlanjur.</h2><button className="dialog-close" type="button" aria-label="Tutup" onClick={onClose}><Icon name="close" /></button></div>
      <div className="dialog-body">
        <p>Lakukan berurutan. Kalau kamu tidak yakin harus menghubungi siapa, mulai dari aplikasi resmi bank atau dompet digital yang kamu pakai.</p>
        <ol className="dialog-list">
          <li><strong>Hubungi bank sekarang.</strong> Minta transaksi dibekukan atau dibatalkan. Catat nomor tiket laporan.</li>
          <li><strong>Amankan akun.</strong> Ganti kata sandi, PIN, dan kode akses. Aktifkan verifikasi dua langkah.</li>
          <li><strong>Simpan bukti.</strong> Tangkapan layar pesan, nomor rekening, nominal, waktu, dan nama penerima.</li>
          <li><strong>Laporkan.</strong> Gunakan kanal resmi bank, dompet digital, dan layanan pelaporan penipuan.</li>
          <li><strong>Beri tahu orang terdekat.</strong> Kalau data pribadimu bocor, minta mereka waspada.</li>
        </ol>
        <p className="dialog-note">CEKAT bukan layanan darurat dan tidak bisa membatalkan transaksi. Hubungi bank atau pihak berwenang untuk penanganan resmi.</p>
      </div>
    </dialog>
  );
}
