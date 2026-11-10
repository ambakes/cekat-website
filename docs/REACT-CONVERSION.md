# Konversi React + TypeScript

Konversi dilakukan pada proyek yang sama. Tidak ada salinan `v2/` atau implementasi HTML lama yang tetap aktif.

## 1. Fondasi

- React dan React DOM untuk UI; TypeScript dengan `strict`, `isolatedModules`, serta pemeriksaan variabel/parameter tidak terpakai.
- Vite untuk development dan bundel produksi. `index.html` dan `alat.html` tetap menjadi entry terpisah agar tautan lama dan bookmark bertahan.
- Tidak memerlukan React Router untuk dua entry ini. Perpindahan halaman memakai tautan biasa, sementara anchor tetap bekerja di halaman masing-masing.
- `src/main.tsx` memasang `App` melalui `createRoot` dan `StrictMode`.

## 2. Komponen bersama

`SiteHeader`, `SiteFooter`, `Brand`, `IconSymbols`, `HeroScene`, `ECGWaveform`, `AccessibilityPanel`, dan `EmergencyDialog` menggantikan partial HTML. SVG dipindah ke JSX asli, tanpa `dangerouslySetInnerHTML`.

Pemilihan tema mengikuti provider. Warna hero, tidur/terbang burung hantu, pengurangan animasi, dan ECG mobile tetap ditentukan oleh CSS yang sama.

## 3. State dan efek

- `PreferencesProvider` mengelola tema dan preferensi aksesibilitas. Listener storage dan media query dilepas melalui cleanup effects.
- `useDismissable` menangani Escape dan klik luar tanpa mendaftarkan listener klik untuk setiap elemen.
- Menu mobile memakai state dan melepaskan penguncian scroll saat ditutup/unmount.
- Dialog memakai elemen `<dialog>` dan ref React.
- `public/preferences-bootstrap.js` adalah **artefak JavaScript kecil yang disengaja**, bukan controller lama. Ia dibuat dari model TypeScript agar preferensi diterapkan sebelum CSS/React selesai dimuat. Edit model/generator, bukan artefaknya.

## 4. Pemeriksaan di browser

`src/features/checker/CheckTools.tsx` menyediakan tab tautan, pesan, dan QR/QRIS. URL dikirim langsung dari React ke Google Safe Browsing API v4; teks pesan ke IsThisSpam API. Analisis heuristik untuk pesan/tautan tetap berjalan lokal sebagai konteks tambahan. QRIS memakai parser TLV/CRC, dan gambar QR didekode melalui aset lokal `public/assets/vendor/jsQR.js`.

Tidak ada backend CEKAT. `.env` root dibaca Vite; `vite.config.mjs` menyisipkan API key ke dalam bundle agar browser dapat memanggil layanan. URL dan teks pesan yang diperiksa dikirim ke provider masing-masing. IsThisSpam menyarankan key tetap privat di server, sehingga konfigurasi client-only ini hanya cocok untuk pengembangan atau penggunaan pribadi dengan risiko key terlihat oleh pengguna browser. Folder `test-api/` adalah referensi sumber dan tidak dipanggil oleh frontend.

## 6. Latihan dan Edukasi

Data soal memiliki id skenario dan pilihan yang stabil. `Practice` memakai state untuk pilihan, penguncian jawaban, perpindahan soal, dan putaran baru. Model skor/pengacakan dapat diuji tanpa React atau browser.

Materi bab berada di `chapters.ts`. `useReadingProgress` mengukur posisi bab untuk progres, penanda daftar isi, dan bookmark. Listener scroll, timer, animation frame, media query, serta ResizeObserver memiliki cleanup. Bookmark hanya menerima id bab yang valid.

## 7. Verifikasi

Typecheck proyek, build produksi Vite, dan pemeriksaan struktur lolos setelah fitur analisis lokal dipasang. Koneksi langsung ke Google dan IsThisSpam belum diverifikasi lewat browser; CORS dan konfigurasi key provider dapat memengaruhi keberhasilan.
