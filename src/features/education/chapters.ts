import type { EducationChapter } from './types';

export const educationChapters: readonly EducationChapter[] = [
  {
    "id": "phishing",
    "title": "Phishing",
    "summary": "Tautan phishing meniru tampilan bank, kurir, atau toko. Yang paling penting bukan tampilannya, tapi alamat yang benar-benar kamu buka.",
    "points": [
      "Baca domain dari kanan ke kiri sebelum mengetuk.",
      "Waspadai pesan mendesak seperti “akun diblokir” atau “paket dikembalikan hari ini”.",
      "Jangan mengetik kata sandi, PIN, atau OTP setelah membuka tautan dari pesan."
    ],
    "takeaway": "Tampilan bisa mirip, alamat bisa palsu.",
    "illustration": {
      "src": "/assets/simulasi/phishing.svg",
      "alt": "Simulasi situs paket palsu yang meminta kode akses melalui domain klaim-paket.invalid.",
      "caption": "Simulasi phishing: tampilan situs terlihat rapi, tetapi alamatnya memakai domain rekaan. Periksa domain sebelum memasukkan data."
    }
  },
  {
    "id": "otp",
    "title": "Kode OTP",
    "summary": "Kode OTP adalah kunci sekali pakai. Siapa pun yang memilikinya bisa masuk ke akunmu, bahkan tanpa kata sandi.",
    "points": [
      "Jangan bagikan OTP ke siapa pun, termasuk yang mengaku keluarga atau petugas bank.",
      "Petugas resmi tidak pernah meminta OTP lewat telepon atau pesan.",
      "Kalau kamu sudah mengirim, segera ganti kata sandi dan hubungi bank."
    ],
    "takeaway": "OTP hanya untuk kamu sendiri.",
    "illustration": {
      "src": "/assets/simulasi/otp.svg",
      "alt": "Simulasi pesan dari nomor tak dikenal yang meminta OTP dan balasan yang menolak membagikannya.",
      "caption": "Simulasi pesan: pengirim mengaku petugas dan mendesak meminta OTP. Kode rahasia tetap milik kamu."
    }
  },
  {
    "id": "qris",
    "title": "QRIS palsu",
    "summary": "Stiker QR di meja warung bisa ditukar. Sebelum membayar, pastikan nama penerima sesuai dengan tempat yang kamu datangi.",
    "points": [
      "Cocokkan nama penerima di aplikasi dengan nama warung atau toko.",
      "Waspadai QR yang ditempel di atas QR lama atau terlihat mencurigakan.",
      "Kalau nama penerima berbeda, batalkan dan tanya kasir."
    ],
    "takeaway": "Nominal cocok belum berarti penerima benar.",
    "illustration": {
      "src": "/assets/simulasi/qris.svg",
      "alt": "Simulasi QRIS Warung Sari dengan nama penerima Toko Lain yang berbeda di aplikasi pembayaran.",
      "caption": "Simulasi QRIS: nama warung dan penerima berbeda. Batalkan dulu, lalu konfirmasi ke kasir. Gambar QR ini hanya ilustrasi."
    }
  },
  {
    "id": "hadiah",
    "title": "Hadiah palsu",
    "summary": "Hadiah yang meminta biaya admin, pajak, atau uang muka hampir selalu penipuan. Hadiah asli tidak meminta kamu membayar dulu.",
    "points": [
      "Jangan transfer uang untuk mencairkan hadiah.",
      "Cek sumber informasi lewat situs atau akun resmi penyelenggara.",
      "Abaikan pesan yang mendesak dan memakai tautan pendek."
    ],
    "takeaway": "Hadiah asli tidak meminta uang muka."
  },
  {
    "id": "akun",
    "title": "Akun tiruan",
    "summary": "Nomor baru yang mengaku keluarga atau teman bisa jadi akun tiruan. Polanya biasanya langsung minta uang, kode, atau data pribadi.",
    "points": [
      "Telepon atau video call lewat nomor lama yang sudah kamu simpan.",
      "Jangan mengirim uang atau kode sebelum suara dan identitasnya terkonfirmasi.",
      "Minta orang terdekat memverifikasi dari kanal lain."
    ],
    "takeaway": "Kenali orangnya, bukan hanya namanya."
  },
  {
    "id": "darurat",
    "title": "Modus darurat",
    "summary": "Pesan panik sering membuat orang bertindak cepat tanpa berpikir. Penipu memakai tekanan waktu supaya kamu tidak sempat memeriksa.",
    "points": [
      "Berhenti dulu, tarik napas, dan jangan langsung membalas.",
      "Hubungi orang atau institusi terkait lewat nomor resmi yang kamu cari sendiri.",
      "Simpan bukti dan laporkan pesan mencurigakan."
    ],
    "takeaway": "Rasa panik adalah tanda untuk berhenti, bukan mempercepat."
  }
];
