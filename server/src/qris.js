
const URL_PATTERN = /https?:\/\/[^\s<>"'`]+/i;

function stripTrailingPunctuation(value) {
  return value.replace(/[.,;:!?)\]}]+$/, "");
}

export function crc16(input) {
  const buffer = Buffer.isBuffer(input)
    ? input
    : Buffer.from(input, "utf8");

  let crc = 0xffff;

  for (const byte of buffer) {
    crc ^= byte << 8;

    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000
        ? ((crc << 1) ^ 0x1021) & 0xffff
        : (crc << 1) & 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function parseTlv(payload) {
  const buffer = Buffer.from(payload, "utf8");
  const fields = [];
  let offset = 0;

  while (offset < buffer.length) {
    if (offset + 4 > buffer.length) {
      throw new Error("Struktur TLV tidak lengkap.");
    }

    const tag = buffer.toString("ascii", offset, offset + 2);
    const lengthText = buffer.toString(
      "ascii",
      offset + 2,
      offset + 4
    );

    if (!/^\d{2}$/.test(tag) || !/^\d{2}$/.test(lengthText)) {
      throw new Error("Tag atau panjang TLV tidak valid.");
    }

    const length = Number(lengthText);
    const valueStart = offset + 4;
    const valueEnd = valueStart + length;

    if (valueEnd > buffer.length) {
      throw new Error("Panjang nilai TLV melebihi data.");
    }

    fields.push({
      tag,
      value: buffer.toString("utf8", valueStart, valueEnd)
    });

    offset = valueEnd;
  }

  return fields;
}

export function validateCrc(payload) {
  const buffer = Buffer.from(payload, "utf8");
  const marker = Buffer.from("6304", "ascii");
  const index = buffer.lastIndexOf(marker);

  if (index === -1) {
    return { valid: false, expected: null, actual: null };
  }

  const actual = buffer
    .toString("ascii", index + 4, index + 8)
    .toUpperCase();

  if (!/^[0-9A-F]{4}$/.test(actual)) {
    return { valid: false, expected: null, actual };
  }

  const expected = crc16(buffer.subarray(0, index + 4));

  return {
    valid: expected === actual,
    expected,
    actual
  };
}

function isQrisCandidate(content) {
  if (content.startsWith("000201")) {
    return true;
  }

  if (!content.includes("6304")) {
    return false;
  }

  try {
    const fields = parseTlv(content);
    return fields.some(
      field => field.tag === "00" && field.value === "01"
    );
  } catch {
    return false;
  }
}

function analyzeWifi(content) {
  const body = content.replace(/^WIFI:/i, "");
  const fields = {};

  for (const part of body.split(";")) {
    const separator = part.indexOf(":");

    if (separator === -1) {
      continue;
    }

    const key = part.slice(0, separator).toUpperCase();
    fields[key] = part.slice(separator + 1);
  }

  const security = (fields.T || "").toLowerCase();
  const hidden = fields.H === "true";
  const findings = [];
  let score = 0;

  if (!security || security === "nopass") {
    findings.push({
      severity: "medium",
      message: "Jaringan Wi-Fi terbuka tanpa password."
    });
    score += 2;
  }

  if (hidden) {
    findings.push({
      severity: "low",
      message: "Jaringan Wi-Fi disembunyikan."
    });
    score += 1;
  }

  return {
    type: "wifi",
    risk: score >= 2 ? "medium" : "low",
    score,
    findings,
    urls: [],
    wifi: {
      ssid: fields.S ?? null,
      security: security || null,
      hidden
    }
  };
}

function analyzeQris(content) {
  const fields = parseTlv(content);
  const values = {};
  const counts = new Map();
  const findings = [];
  let score = 0;

  function add(severity, message, points) {
    findings.push({ severity, message });
    score += points;
  }

  for (const { tag, value } of fields) {
    counts.set(tag, (counts.get(tag) ?? 0) + 1);

    if (!(tag in values)) {
      values[tag] = value;
    }
  }

  if (values["00"] !== "01") {
    add(
      "high",
      "Payload format indicator QRIS bukan 01.",
      5
    );
  }

  for (const [tag, count] of counts) {
    if (count > 1) {
      add(
        "medium",
        `Tag QRIS ${tag} muncul lebih dari sekali.`,
        2
      );
    }
  }

  const crc = validateCrc(content);

  if (!crc.valid) {
    add(
      "high",
      "CRC QRIS tidak valid; data bisa rusak atau dimanipulasi.",
      5
    );
  }

  const currency = values["53"] ?? null;

  if (currency && currency !== "360") {
    add(
      "high",
      `Mata uang QRIS bukan IDR (${currency}).`,
      5
    );
  }

  const country = values["58"] ?? null;

  if (country && country !== "ID") {
    add(
      "medium",
      `Negara merchant bukan Indonesia (${country}).`,
      2
    );
  }

  const amountRaw = values["54"] ?? null;
  const amount =
    amountRaw && /^\d+(?:\.\d+)?$/.test(amountRaw)
      ? Number(amountRaw)
      : null;

  if (amountRaw && amount === null) {
    add(
      "medium",
      "Nominal QRIS tidak berformat angka yang valid.",
      2
    );
  }

  const mode = values["01"] === "12" ? "dynamic" : "static";

  if (mode === "dynamic" && amount === null) {
    add(
      "medium",
      "QRIS dinamis tidak mencantumkan nominal.",
      2
    );
  }

  if (mode === "static" && amount !== null) {
    add(
      "medium",
      "QRIS statis mencantumkan nominal; periksa kembali.",
      2
    );
  }

  if (!values["59"]) {
    add("medium", "Nama merchant tidak tercantum.", 2);
  }

  const merchantAccounts = fields
    .filter(field => {
      const tag = Number(field.tag);
      return tag >= 26 && tag <= 51;
    })
    .map(field => {
      try {
        const subFields = parseTlv(field.value);
        const subValues = {};

        for (const sub of subFields) {
          if (!(sub.tag in subValues)) {
            subValues[sub.tag] = sub.value;
          }
        }

        return {
          tag: field.tag,
          guid: subValues["00"] ?? null,
          merchantId: subValues["02"] ?? null
        };
      } catch {
        return {
          tag: field.tag,
          guid: null,
          merchantId: null
        };
      }
    });

  if (merchantAccounts.length === 0) {
    add(
      "medium",
      "Informasi akun merchant tidak ditemukan.",
      2
    );
  }

  return {
    type: "qris",
    risk: score >= 5 ? "high" : score >= 2 ? "medium" : "low",
    score,
    findings,
    urls: [],
    qris: {
      mode,
      merchantName: values["59"] ?? null,
      city: values["60"] ?? null,
      country,
      currency: currency === "360" ? "IDR" : currency,
      amount,
      amountRaw,
      mcc: values["52"] ?? null,
      crcValid: crc.valid,
      crcExpected: crc.expected,
      crcActual: crc.actual,
      merchantAccounts
    }
  };
}

export function analyzeQrContent(rawContent) {
  const content = String(rawContent).trim();
  const urlMatch = content.match(URL_PATTERN);
  const isQris = isQrisCandidate(content);

  if (/^https?:\/\//i.test(content)) {
    return {
      type: "url",
      risk: "low",
      score: 0,
      findings: [],
      urls: [stripTrailingPunctuation(content)],
      qris: null
    };
  }

  if (urlMatch && !isQris) {
    return {
      type: "url",
      risk: "low",
      score: 0,
      findings: [],
      urls: [stripTrailingPunctuation(urlMatch[0])],
      qris: null
    };
  }

  if (isQris) {
    try {
      return analyzeQris(content);
    } catch (error) {
      return {
        type: "qris",
        risk: "high",
        score: 5,
        findings: [
          {
            severity: "high",
            message:
              `Struktur QRIS tidak valid: ${error.message}`
          }
        ],
        urls: [],
        qris: null
      };
    }
  }

  if (/^WIFI:/i.test(content)) {
    return analyzeWifi(content);
  }

  if (/^BEGIN:VCARD/i.test(content)) {
    return {
      type: "vcard",
      risk: "low",
      score: 0,
      findings: [],
      urls: [],
      qris: null
    };
  }

  if (/^SMSTO:/i.test(content)) {
    return {
      type: "sms",
      risk: "low",
      score: 0,
      findings: [
        {
          severity: "low",
          message:
            "QR berisi perintah SMS; periksa nomor tujuan sebelum mengirim."
        }
      ],
      urls: [],
      qris: null
    };
  }

  if (/^tel:/i.test(content)) {
    return {
      type: "tel",
      risk: "low",
      score: 0,
      findings: [],
      urls: [],
      qris: null
    };
  }

  if (/^mailto:/i.test(content)) {
    return {
      type: "email",
      risk: "low",
      score: 0,
      findings: [],
      urls: [],
      qris: null
    };
  }

  if (/^geo:/i.test(content)) {
    return {
      type: "location",
      risk: "low",
      score: 0,
      findings: [],
      urls: [],
      qris: null
    };
  }

  return {
    type: "text",
    risk: "low",
    score: 0,
    findings: [],
    urls: [],
    qris: null
  };
}

export function qrAdvice(type, risk) {
  if (type === "qris") {
    if (risk === "high") {
      return (
        "Jangan bayar. Data QRIS tidak lolos validasi. " +
        "Minta QR baru dari merchant lewat kanal resmi."
      );
    }

    return (
      "Cocokkan nama merchant dan nominal dengan yang " +
      "tertera di aplikasi sebelum membayar. CRC valid " +
      "bukan jaminan merchant resmi."
    );
  }

  if (type === "url") {
    if (risk === "high") {
      return (
        "Jangan buka tautan dari QR ini. Periksa domain " +
        "dan reputasinya terlebih dahulu."
      );
    }

    if (risk === "medium") {
      return (
        "Hati-hati. Buka tautan hanya jika domainnya " +
        "sesuai dengan sumber resmi."
      );
    }

    return (
      "Tautan tidak menunjukkan indikasi kuat, tetapi " +
      "tetap periksa domain sebelum membuka."
    );
  }

  if (type === "wifi") {
    return (
      "Jaringan terbuka bisa disadap. Hindari mengakses " +
      "akun atau pembayaran saat terhubung."
    );
  }

  if (type === "text") {
    return (
      "QR berisi teks biasa, bukan tautan atau QRIS. " +
      "Jangan masukkan data pribadi ke pihak yang tidak dikenal."
    );
  }

  return (
    "Periksa kembali tujuan QR sebelum melanjutkan. " +
    "Jangan bagikan data pribadi."
  );
}
