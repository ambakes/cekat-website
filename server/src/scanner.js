
import { BRANDS as BRAND_DATA } from "./data.js";

const IPV4 =
  /^(?:\d{1,3}\.){3}\d{1,3}$/;

const SEED_BRAND_COUNT = 40;

const COUNTRY_SUFFIXES = new Set([
  "co.id", "com.id", "or.id", "ac.id", "go.id",
  "co.uk", "org.uk", "ac.uk", "gov.uk",
  "com.au", "net.au", "org.au", "co.nz",
  "com.br", "com.mx", "com.ar", "com.tr",
  "com.cn", "com.hk", "com.sg", "com.my",
  "com.ph", "com.tw", "com.vn", "com.pk",
  "co.in", "firm.in", "net.in", "org.in",
  "co.jp", "co.kr", "co.za", "com.ng",
  "com.eg", "com.sa", "com.pl", "com.ua",
  "com.de", "com.fr", "com.es", "com.it"
]);

const GENERIC_LABELS = new Set([
  "mail", "email", "web", "site", "page", "pages",
  "home", "news", "blog", "shop", "store", "bank",
  "pay", "support", "help", "login", "account",
  "admin", "portal", "auth", "secure", "safe",
  "trust", "cloud", "dns", "nic", "reg", "who",
  "ntp", "loc", "svc", "img", "cdn", "api", "app",
  "apps", "dev", "test", "static", "media", "photo",
  "image", "file", "files", "video", "music", "games",
  "game", "play", "live", "chat", "office", "docs",
  "drive", "forms", "note", "notes", "share", "link",
  "code", "data", "tech", "digital", "network",
  "online", "global", "local", "mobile", "phone",
  "smart", "time", "people", "weather", "travel",
  "sport", "health", "education", "free", "best",
  "top", "new", "first", "prime", "plus", "pro",
  "max", "super", "ultra", "mega", "micro", "soft",
  "open", "direct", "express", "fast", "quick",
  "easy", "simple", "true", "real", "original",
  "official", "name", "state", "goal", "focus",
  "force", "one", "bit", "service", "services"
]);

const MULTI_TENANT_DOMAINS = new Set([
  "blogspot.com",
  "wixsite.com",
  "weebly.com",
  "myshopify.com",
  "sharepoint.com",
  "azurewebsites.net",
  "herokuapp.com",
  "netlify.app",
  "vercel.app",
  "tumblr.com",
  "substack.com",
  "workers.dev",
  "github.io"
]);

const BRANDS = BRAND_DATA
  .map((brand, index) => ({
    name: brand.name,
    domains: brand.domains,
    token: brand.name.toLowerCase(),
    isSeed: index < SEED_BRAND_COUNT
  }))
  .filter(
    brand =>
      brand.token.length >= 3 &&
      /^[a-z]+$/.test(brand.token) &&
      (brand.isSeed || !GENERIC_LABELS.has(brand.token))
  );

function normalizeLabel(label) {
  return label
    .toLowerCase()
    .replace(/0/g, "o")
    .replace(/1/g, "l")
    .replace(/3/g, "e")
    .replace(/5/g, "s")
    .replace(/[^a-z]/g, "");
}

function editDistance(a, b) {
  let previous = Array.from(
    { length: b.length + 1 },
    (_, index) => index
  );

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];

    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] +
          (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }

    previous = current;
  }

  return previous[b.length];
}

function matchOfficialDomain(host, brand) {
  const { token, domains } = brand;

  const literal = domains.find(
    domain => host === domain || host.endsWith(`.${domain}`)
  );

  if (literal) {
    return literal;
  }

  const parts = host.split(".");
  const last = parts.at(-1);
  const secondLast = parts.at(-2);

  // Varian negara: google.de, mail.google.co.uk, dst.
  if (last.length === 2 && secondLast === token) {
    return `${token}.${last}`;
  }

  if (
    COUNTRY_SUFFIXES.has(`${secondLast}.${last}`) &&
    parts.at(-3) === token
  ) {
    return `${token}.${secondLast}.${last}`;
  }

  return null;
}

function findKnownDomain(host) {
  for (const brand of BRANDS) {
    const matched = matchOfficialDomain(host, brand);

    if (!matched) {
      continue;
    }

    if (
      MULTI_TENANT_DOMAINS.has(matched) &&
      host !== matched
    ) {
      return null;
    }

    return matched;
  }

  return null;
}

function findBrandImpersonation(host) {
  const labels = host.split(".").filter(Boolean);

  for (const brand of BRANDS) {
    if (matchOfficialDomain(host, brand)) {
      continue;
    }

    const token = brand.token;
    let looksLikeTypo = false;

    for (const label of labels) {
      const normalized = normalizeLabel(label);

      if (
        label === token ||
        label.split("-").includes(token) ||
        normalized === token
      ) {
        return { brand, typo: false };
      }

      // Deteksi typo hanya untuk 40 brand awal yang sudah dikurasi,
      // agar dataset 1.000 entri tidak memicu false positive.
      if (
        brand.isSeed &&
        !GENERIC_LABELS.has(normalized) &&
        token.length >= 5 &&
        Math.abs(normalized.length - token.length) <= 1 &&
        editDistance(normalized, token) <= 1
      ) {
        looksLikeTypo = true;
      }
    }

    if (looksLikeTypo) {
      return { brand, typo: true };
    }
  }

  return null;
}

export function analyzeUrl(rawUrl) {
  let url;

  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Format URL tidak valid.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("URL harus menggunakan HTTP atau HTTPS.");
  }

  const host = url.hostname.toLowerCase();
  const findings = [];

  if (IPV4.test(host)) {
    findings.push("Menggunakan alamat IP langsung.");
  }

  if (host.includes("xn--")) {
    findings.push(
      "Domain menggunakan format Punycode."
    );
  }

  if (url.username || url.password) {
    findings.push(
      "URL mengandung informasi login sebelum nama host."
    );
  }

  if (host.split(".").length >= 5) {
    findings.push(
      "Domain memiliki banyak tingkat subdomain."
    );
  }

  if (rawUrl.length > 200) {
    findings.push("URL sangat panjang.");
  }

  const matchedDomain = findKnownDomain(host);
  const impersonation = findBrandImpersonation(host);

  if (impersonation) {
    const { brand, typo } = impersonation;

    findings.unshift(
      typo
        ? `Nama domain sangat mirip dengan ${brand.name} ` +
          `(domain resmi: ${brand.domains[0]}).`
        : `Menyamar sebagai ${brand.name} ` +
          `(domain resmi: ${brand.domains[0]}).`
    );
  }

  return {
    hostname: host,
    matchedDomain,
    findings,
    suspicious:
      Boolean(impersonation) || findings.length >= 2
  };
}
