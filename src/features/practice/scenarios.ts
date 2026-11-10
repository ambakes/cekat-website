import type { PracticeScenario } from './types';

export const scenarioBank: readonly PracticeScenario[] = [
  {
    "name": "Keluarga",
    "note": "Pesan dari akun yang dikenal",
    "avatar": "K",
    "messages": [
      "Akun kakakmu mengirim pesan: Aku sedang butuh bantuan. Tolong transfer ke rekening teman ini, nanti aku ganti.",
      "Foto profilnya benar, tetapi ia menolak ditelepon dan meminta kamu segera mengirim uang."
    ],
    "question": "Apa yang sebaiknya kamu lakukan?",
    "choices": [
      {
        "text": "Minta foto terbaru lewat percakapan yang sama sebelum transfer.",
        "correct": false,
        "feedback": "Foto masih bisa dikirim orang yang menguasai akun. Periksa identitas melalui jalur lain yang sudah kamu kenal.",
        "id": "family-account-1"
      },
      {
        "text": "Hubungi kakak lewat nomor tersimpan atau keluarga lain.",
        "correct": true,
        "feedback": "Akun dan foto yang dikenal belum membuktikan siapa pengirimnya. Verifikasi lewat jalur lain sebelum mengirim uang.",
        "id": "family-account-2"
      },
      {
        "text": "Kirim sebagian dulu sambil menunggu kakak bisa ditelepon.",
        "correct": false,
        "feedback": "Transfer sebagian tetap berisiko jika identitas dan rekening belum jelas. Pastikan dulu siapa yang meminta.",
        "id": "family-account-3"
      }
    ],
    "id": "family-account"
  },
  {
    "name": "Kurir paket",
    "note": "Pesan tentang pesananmu",
    "avatar": "K",
    "messages": [
      "Kamu memang sedang menunggu paket. Sebuah pesan menyebut nomor resimu dan meminta biaya tambahan Rp9.000 lewat tautan.",
      "Halaman itu menggunakan HTTPS dan logo kurir, tetapi alamatnya berbeda dari situs resmi."
    ],
    "question": "Bagaimana memeriksa permintaan biaya ini?",
    "choices": [
      {
        "text": "Bayar karena nomor resi benar dan biayanya kecil.",
        "correct": false,
        "feedback": "Nomor resi yang cocok dan nominal kecil tidak mengesahkan pengirim. Permintaan biaya tetap perlu diperiksa.",
        "id": "parcel-fee-1"
      },
      {
        "text": "Lanjutkan jika browser tidak menampilkan peringatan.",
        "correct": false,
        "feedback": "HTTPS dan tidak adanya peringatan bukan jaminan situs milik kurir. Tampilan juga bisa ditiru.",
        "id": "parcel-fee-2"
      },
      {
        "text": "Buka aplikasi kurir sendiri dan cek status serta tagihannya.",
        "correct": true,
        "feedback": "Periksa melalui aplikasi atau situs resmi yang kamu buka sendiri. Jangan memakai tautan dari pesan yang sedang diragukan.",
        "id": "parcel-fee-3"
      }
    ],
    "id": "parcel-fee"
  },
  {
    "name": "Kedai Sore",
    "note": "Pembayaran QRIS di meja",
    "avatar": "K",
    "messages": [
      "Kamu makan di Kedai Sore. Setelah memindai QR, aplikasi menampilkan nama TOKO MAJU, meskipun nominalnya sesuai.",
      "Orang di antrean bilang nama itu milik pengelola kedai. Kamu belum bertanya kepada kasir."
    ],
    "question": "Apa langkah paling tepat sebelum membayar?",
    "choices": [
      {
        "text": "Tunda dan minta kasir memastikan QR serta nama penerimanya.",
        "correct": true,
        "feedback": "Nama dan QR perlu diverifikasi ke pihak toko. Nominal yang benar atau keterangan orang di antrean belum cukup.",
        "id": "merchant-name-1"
      },
      {
        "text": "Bayar karena nominalnya sesuai dengan pesanan.",
        "correct": false,
        "feedback": "Nominal yang cocok belum memastikan penerimanya benar. Cocokkan tujuan pembayaran melalui kasir.",
        "id": "merchant-name-2"
      },
      {
        "text": "Langsung simpulkan kedai menipu karena namanya berbeda.",
        "correct": false,
        "feedback": "Perbedaan nama perlu diperiksa, bukan langsung menjadi kesimpulan. Minta pihak toko menjelaskannya sebelum membayar.",
        "id": "merchant-name-3"
      }
    ],
    "id": "merchant-name"
  },
  {
    "name": "Hadiah belanja",
    "note": "Pesan mengatasnamakan toko",
    "avatar": "H",
    "messages": [
      "Pesan mengaku dari toko tempat kamu pernah belanja. Kamu disebut memenangkan hadiah dan diminta membayar biaya admin Rp50.000.",
      "Pengirim mengetahui namamu dan menunjukkan logo toko, tetapi informasi hadiah belum kamu cek di aplikasi toko."
    ],
    "question": "Apa yang paling aman dilakukan?",
    "choices": [
      {
        "text": "Minta bukti hadiah lain dari pengirim sebelum membayar.",
        "correct": false,
        "feedback": "Bukti yang dikirim orang yang sama bisa direkayasa. Cek melalui saluran resmi yang kamu buka sendiri.",
        "id": "prize-fee-1"
      },
      {
        "text": "Cek promosi melalui aplikasi resmi tanpa mengirim biaya.",
        "correct": true,
        "feedback": "Nama dan logo tidak mengesahkan pengirim. Verifikasi hadiah di saluran resmi dan jangan membayar hanya berdasarkan pesan tersebut.",
        "id": "prize-fee-2"
      },
      {
        "text": "Bayar jika rekening penerima memakai nama toko.",
        "correct": false,
        "feedback": "Nama yang terlihat sesuai belum membuktikan bahwa permintaan hadiah benar. Verifikasi promosi terlebih dahulu.",
        "id": "prize-fee-3"
      }
    ],
    "id": "prize-fee"
  },
  {
    "name": "Dukungan pelanggan",
    "note": "Panggilan setelah keluhan",
    "avatar": "D",
    "messages": [
      "Setelah kamu mengeluh di media sosial, seseorang menelepon mengaku petugas. Ia mengetahui nominal transaksimu.",
      "Ia tidak meminta OTP, tetapi menyuruhmu berbagi layar saat membuka aplikasi bank."
    ],
    "question": "Bagaimana menanggapi permintaan ini?",
    "choices": [
      {
        "text": "Berbagi layar selama kode OTP tidak terlihat.",
        "correct": false,
        "feedback": "Berbagi layar bisa memperlihatkan informasi sensitif lainnya. Tidak meminta OTP bukan jaminan penelepon dapat dipercaya.",
        "id": "support-call-1"
      },
      {
        "text": "Minta foto kartu pegawai, lalu ikuti arahannya.",
        "correct": false,
        "feedback": "Foto kartu pegawai bisa disalin. Verifikasi melalui kanal dukungan resmi, bukan hanya bukti dari penelepon.",
        "id": "support-call-2"
      },
      {
        "text": "Hentikan panggilan dan hubungi dukungan dari aplikasi resmi.",
        "correct": true,
        "feedback": "Hubungi saluran yang kamu pilih sendiri. Pengetahuan tentang transaksi belum membuktikan identitas petugas.",
        "id": "support-call-3"
      }
    ],
    "id": "support-call"
  },
  {
    "name": "Keamanan akun",
    "note": "Permintaan login tak dikenal",
    "avatar": "K",
    "messages": [
      "Ponselmu menerima beberapa permintaan persetujuan login, padahal kamu tidak sedang masuk ke akun.",
      "Pesan yang mengaku dari tim keamanan menyuruhmu menyetujui satu permintaan agar notifikasinya berhenti."
    ],
    "question": "Apa respons yang paling aman?",
    "choices": [
      {
        "text": "Tolak lalu periksa aktivitas akun lewat pengaturan resmi.",
        "correct": true,
        "feedback": "Jangan menyetujui login yang tidak kamu mulai. Periksa sesi dan pengaturan keamanan melalui layanan resmi yang dibuka sendiri.",
        "id": "unknown-login-1"
      },
      {
        "text": "Setujui sekali, lalu segera ganti kata sandi.",
        "correct": false,
        "feedback": "Persetujuan itu bisa memberi akses kepada pihak lain. Mengganti kata sandi setelahnya bukan alasan memberi akses terlebih dahulu.",
        "id": "unknown-login-2"
      },
      {
        "text": "Abaikan karena lokasi login masih satu kota denganmu.",
        "correct": false,
        "feedback": "Perkiraan lokasi belum membuktikan bahwa login berasal darimu. Periksa permintaan yang tidak kamu mulai.",
        "id": "unknown-login-3"
      }
    ],
    "id": "unknown-login"
  }
];
