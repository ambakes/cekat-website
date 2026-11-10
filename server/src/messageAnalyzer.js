
import {
  AUTHORITY_WORDS,
  LURE_WORDS,
  OBFUSCATED_BRANDS,
  PHONE_NUMBER,
  REQUEST_VERBS,
  SENSITIVE_DATA,
  URGENCY_WORDS,
  URL_PATTERN,
  ZERO_WIDTH
} from "./patterns.js";

const MAX_URLS = 3;

function stripTrailingPunctuation(url) {
  return url.replace(/[.,;:!?)\]}]+$/, "");
}

export function extractUrls(text) {
  const found = text.match(URL_PATTERN) ?? [];
  const urls = [];

  for (const raw of found) {
    const url = stripTrailingPunctuation(raw);

    if (url && !urls.includes(url)) {
      urls.push(url);
    }

    if (urls.length >= MAX_URLS) {
      break;
    }
  }

  return urls;
}

export function riskFromScore(score) {
  if (score >= 7) {
    return "high";
  }

  if (score >= 3) {
    return "medium";
  }

  return "low";
}

export function analyzeMessage(rawText) {
  const text = rawText.trim();
  const findings = [];
  const urls = extractUrls(text);
  let score = 0;

  function add(severity, message, points) {
    findings.push({ severity, message });
    score += points;
  }

  const sensitive = SENSITIVE_DATA.filter(
    item => item.regex.test(text)
  );
  const hasUrgency = URGENCY_WORDS.test(text);
  const hasLure = LURE_WORDS.test(text);
  const hasAuthority = AUTHORITY_WORDS.test(text);
  const asksAction =
    REQUEST_VERBS.test(text) || urls.length > 0;

  for (const item of sensitive) {
    if (asksAction) {
      add(
        "high",
        `${item.label} dan meminta tindakan.`,
        5
      );
    } else {
      add("medium", item.label, 2);
    }
  }

  if (hasUrgency) {
    add(
      "medium",
      "Menggunakan tekanan waktu atau ancaman.",
      2
    );
  }

  if (hasLure) {
    add(
      "medium",
      "Berisi janji hadiah, keuntungan, atau bantuan.",
      2
    );
  }

  if (hasAuthority) {
    add(
      asksAction ? "medium" : "low",
      "Menyebut institusi, bank, atau jasa kurir tertentu.",
      asksAction ? 2 : 1
    );
  }

  if (hasAuthority && PHONE_NUMBER.test(text) && asksAction) {
    add(
      "high",
      "Mengaku institusi tetapi meminta kontak lewat nomor pribadi.",
      3
    );
  }

  if (
    urls.length > 0 &&
    (hasLure || hasUrgency)
  ) {
    add(
      "medium",
      "Menggabungkan tautan dengan iming-iming atau tekanan.",
      2
    );
  }

  if (OBFUSCATED_BRANDS.test(text)) {
    add(
      "medium",
      "Menggunakan penulisan yang menyamarkan nama merek.",
      3
    );
  }

  if (ZERO_WIDTH.test(text)) {
    add(
      "high",
      "Mengandung karakter tak terlihat (zero-width).",
      4
    );
  }

  const letters = text.replace(/[^A-Za-z]/g, "");

  if (letters.length >= 20) {
    const uppercase = text.replace(/[^A-Z]/g, "").length;

    if (uppercase / letters.length > 0.6) {
      add("low", "Menggunakan huruf kapital berlebihan.", 1);
    }
  }

  if (/[!?]{3,}/.test(text)) {
    add("low", "Menggunakan tanda baca berulang.", 1);
  }

  return {
    risk: riskFromScore(score),
    score,
    findings,
    urls,
    sensitive: sensitive.length > 0
  };
}

export function messageAdvice(risk, sensitive) {
  if (risk === "high") {
    return (
      "Jangan klik tautan, dan jangan kirim OTP, PIN, " +
      "password, atau data pribadi. Hubungi institusi " +
      "lewat aplikasi atau nomor resmi."
    );
  }

  if (risk === "medium") {
    return (
      "Hati-hati. Verifikasi pengirim lewat kanal resmi " +
      "sebelum membalas atau membuka tautan."
    );
  }

  if (sensitive) {
    return (
      "Pesan menyebut data sensitif. Jangan pernah " +
      "membagikan OTP/PIN kepada siapa pun."
    );
  }

  return (
    "Tidak ada indikasi kuat, tetapi tetap waspada " +
    "terhadap permintaan data pribadi."
  );
}
