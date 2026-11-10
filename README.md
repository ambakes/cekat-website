# CEKAT

Aplikasi edukasi anti-penipuan berbahasa Indonesia menggunakan **React, TypeScript, dan Vite**. Tema mint, ilustrasi alam piksel, serta preferensi aksesibilitas berlaku di kedua halaman.

## Menjalankan

Gunakan Node.js **22.12 atau lebih baru** dan npm. Pastikan berkas `.env` di root berisi kedua API key untuk cek tautan dan cek pesan (jangan menimpa `.env` yang sudah ada):

```bash
npm install
npm run dev
```

Vite membaca `.env` saat development/build dan menyisipkan key ke kode React agar browser dapat memanggil API langsung. Karena itu key terlihat di bundle dan Developer Tools. Dokumentasi IsThisSpam menyarankan key hanya dipakai di server; jangan gunakan key bernilai/produksi pada situs publik dengan mode client-only.

Buka `http://127.0.0.1:4173/` untuk beranda atau `http://127.0.0.1:4173/alat.html` untuk Edukasi. Jalankan melalui Vite; membuka HTML langsung dengan `file://` tidak didukung.

```bash
npm run typecheck  # Pemeriksaan tipe TypeScript
npm test          # Pengujian logika tanpa browser atau jaringan
npm run check     # Struktur, referensi aset, dan penghapusan kode lama
npm run build     # Typecheck dan bundel produksi ke dist/
npm run preview   # Pratinjau hasil build
npm run verify    # Build, pengujian, dan pemeriksaan struktur
```

`npm run dev` dan `npm run build` memperbarui skrip preferensi awal secara otomatis. Pengujian memakai test runner bawaan Node dan tidak memerlukan framework pengujian tambahan.

## Struktur

```text
index.html                         Entry beranda
alat.html                          Entry Edukasi; URL lama dipertahankan
src/
  main.tsx                         Mount React dan impor CSS
  App.tsx                          Komposisi halaman
  config.ts                        Kunci penyimpanan, tema, dan breakpoint
  components/                      Header, footer, logo, hero, dialog, ECG, aksesibilitas
  providers/                       State preferensi global
  hooks/                           Pembacaan preferensi, pengurangan gerak, dismissal
  pages/                           HomePage dan EducationPage
  features/
    checker/                       Koneksi Safe Browsing/IsThisSpam dan analisis QR lokal
      brands.ts                    Dataset domain lokal
    practice/                      Soal, model skor, pengacakan, dan komponen latihan
    education/                     Materi dan hook progres baca
  domain/preferences.ts            Normalisasi preferensi tanpa ketergantungan DOM
  lib/                             Penyimpanan dan clipboard
  styles/                          Token desain dan CSS per bagian
public/
  assets/                          SVG, ilustrasi, font lokal, dan lisensi
    vendor/jsQR.js                 Decoder gambar QR, lisensi Apache-2.0 di folder yang sama
  preferences-bootstrap.js         Hasil generator; preferensi diterapkan sebelum paint
scripts/                           Generator bootstrap dan pemeriksaan struktur
tests/                             Pengujian logika TypeScript
docs/                              Catatan konversi dan batas integrasi
test-api/                          Contoh API; tidak dipakai saat aplikasi React berjalan
```

Kedua HTML adalah entry React ringan. Vite membangun keduanya dan berbagi komponen yang sama; tidak ada duplikasi header, footer, atau SVG hero dalam HTML. Semua aplikasi memakai komponen, props, state, dan effects React; controller DOM imperatif lama telah dihapus.

## Fitur

- **Tautan:** menggabungkan pemeriksaan pola lokal dengan Google Safe Browsing API v4.
- **Pesan:** menggabungkan indikator lokal dengan klasifikasi IsThisSpam, alasan, keyakinan, dan rekomendasi.
- **QR / QRIS:** gambar QR didekode dan isinya dianalisis di peramban. Pemeriksaan mengenali QRIS, Wi-Fi, URL, dan beberapa format umum. CRC tidak membuktikan identitas penerima atau keamanan transaksi.
- **Latihan:** enam kasus tingkat menengah, masing-masing tiga pilihan A–C. Soal dan pilihan diacak setiap putaran; pembahasan menjelaskan tindakan yang disarankan. Skor direset saat mengulang.
- **Edukasi:** enam bab, daftar isi yang mengikuti bacaan, progres, dan bookmark. Ilustrasi rubah berada di daftar isi, bukan di hero.
- **Tampilan:** tema terang/gelap, ukuran teks, kontras tinggi, pengurangan animasi, serta garis bawah tautan. Pengaturan tersimpan secara lokal dan mengikuti perubahan antar-tab.
- **Animasi:** pohon bergoyang, bintang jatuh saat gelap, burung hantu terbang saat gelap dan tidur saat terang. ECG mint hanya muncul di desktop. Pengurangan gerak menghentikan animasi.
- **Bantuan:** dialog langkah awal saat uang terlanjur dikirim; aplikasi tidak mengirim laporan atau membatalkan transaksi.

Logika UI dan decode QR berjalan di browser. Cek tautan/pesan memanggil layanan eksternal langsung dari browser tanpa backend CEKAT; folder `test-api/` hanya menjadi acuan implementasi.

## Kontrak desain

- Mint utama `#8ce0b2`; hover `#b1f0cf`; aksen teks mode terang `#236b50`.
- Amber untuk hasil perlu diperiksa, merah untuk peringatan, hijau untuk jawaban benar.
- Silkscreen lokal untuk judul; sans-serif sistem untuk isi dan kontrol; monospace untuk metadata teknis.
- Sumber token: `src/styles/tokens.css`. Urutan cascade: `src/styles/index.css`.
- Breakpoint: mobile 640px, menu 820px, daftar isi 900px. Nilai pada `src/config.ts` dan CSS harus selaras.
- Bahasa UI menggunakan “kamu”, “tautan”, “pesan”, “pindai”, dan “tingkat menengah”.

## Data dan privasi

URL dikirim ke Google Safe Browsing; teks pesan dikirim ke IsThisSpam. Gambar QR dan hasil decode-nya tetap lokal. Kedua provider menerima data saat fitur dijalankan. API key `.env` dimasukkan ke bundle frontend sehingga bisa dilihat dan disalin pengguna; batasi quota/referrer Google dan pertimbangkan risiko key IsThisSpam. LocalStorage hanya menyimpan preferensi tema, aksesibilitas, dan id bab bookmark.

Berkas publik untuk hosting adalah **isi `dist/`**, bukan seluruh direktori proyek. Font serta lisensinya berada di `public/assets/fonts/`.

## Status validasi lingkungan ini

- 15 pengujian domain/preferensi/soal lolos.
- Typecheck proyek, build Vite produksi, dan pemeriksaan struktur sumber lolos setelah integrasi.
- Koneksi browser langsung ke provider belum diverifikasi di browser; hasil dapat bergantung pada izin CORS provider dan API key.

Jalankan frontend dengan `npm run dev` untuk memakai pemeriksaan. Tahapan konversi dijelaskan di [docs/REACT-CONVERSION.md](docs/REACT-CONVERSION.md).
