
export const SENSITIVE_DATA = [
  {
    regex: /\b(?:otp|kode otp|one[- ]time password|kode verifikasi)\b/i,
    label: "Menyebut kode OTP/verifikasi"
  },
  {
    regex: /\b(?:pin|password|sandi|kata sandi)\b/i,
    label: "Menyebut PIN/password"
  },
  {
    regex: /\b(?:cvv|cvc|nomor kartu|kartu kredit|kartu debit)\b/i,
    label: "Menyebut data kartu"
  },
  {
    regex: /\b(?:ktp|nik|selfie|foto ktp)\b/i,
    label: "Menyebut data identitas"
  },
  {
    regex: /\b(?:token|kode akses)\b/i,
    label: "Menyebut token/kode akses"
  }
];

export const REQUEST_VERBS =
  /\b(?:kirim|kirimkan|berikan|sebutkan|masukkan|isi|balas|konfirmasi|verifikasi|update|perbarui|transfer|bayar|klik|buka|hubungi|scan)\b/i;

export const URGENCY_WORDS =
  /\b(?:segera|hari ini|malam ini|24 jam|sekarang|terakhir|ditangguhkan|diblokir|dinonaktifkan|hangus|denda|penalti|terbatas)\b/i;

export const LURE_WORDS =
  /\b(?:hadiah|menang|undian|gratis|klaim|bonus|cashback|promo|diskon|refund|subsidi|bantuan|beasiswa|lowongan|investasi|cuan|profit)\b/i;

export const AUTHORITY_WORDS =
  /\b(?:bank|bca|bri|bni|mandiri|bjb|btn|dana|ovo|gopay|shopeepay|linkaja|pajak|dukcapil|kominfo|bpjs|pln|jne|jnt|sicepat|anteraja|pos indonesia|kurir|pengadilan|kepolisian)\b/i;

export const PHONE_NUMBER =
  /(?:\+62|62|0)8\d{7,11}\b/;

export const OBFUSCATED_BRANDS =
  /\b(?:g[0o]{2}gl[e3]|b[4a]nk|p[4a]yp[4a]l|f[a4]ceb[o0]{2}k|wh[a4]ts[a4]pp|1nst[a4]gr[a4]m)\b/i;

export const ZERO_WIDTH =
  /[\u200B-\u200D\uFEFF]/;

export const URL_PATTERN =
  /https?:\/\/[^\s<>"'`]+/gi;
