import { createHash } from "node:crypto";

const DEFAULT_BASE_URL =
  "https://email-spam-classifier.ultrondevelopments.workers.dev";

const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_ENTRIES = 200;

const cache = new Map();

export function clearIsthisspamCache() {
  cache.clear();
}

function readCache(key) {
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  if (Date.now() - entry.time > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

function writeCache(key, value) {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }

  cache.set(key, { time: Date.now(), value });
}

function cacheKey(content, type) {
  return createHash("sha256")
    .update(`${type}\u0000${content}`)
    .digest("hex");
}

function normalizeArray(value) {
  return Array.isArray(value)
    ? value.filter(item => typeof item === "string" && item.trim())
    : [];
}

function unavailable(error, status = null) {
  return {
    provider: "isthisspam",
    available: false,
    error,
    status
  };
}

export async function classifyWithIsThisSpam(content, options = {}) {
  const apiKey = process.env.ISTHISSPAM_API_KEY;

  if (!apiKey) {
    return unavailable("API key IsThisSpam belum dikonfigurasi.");
  }

  if (typeof content !== "string" || !content.trim()) {
    return unavailable("Isi yang akan diklasifikasi kosong.");
  }

  const {
    type = "text",
    metadata = null,
    timeoutMs = 12000
  } = options;

  const baseUrl = (
    process.env.ISTHISSPAM_BASE_URL || DEFAULT_BASE_URL
  ).replace(/\/+$/, "");

  const key = cacheKey(content, type);
  const cached = readCache(key);

  if (cached) {
    return { ...cached, cached: true };
  }

  const payload = {
    content: content.slice(0, 64000),
    type
  };

  if (metadata && typeof metadata === "object") {
    payload.metadata = metadata;
  }

  try {
    const response = await fetch(`${baseUrl}/api/v1/classify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs)
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return unavailable(
        data?.error || `IsThisSpam membalas HTTP ${response.status}.`,
        response.status
      );
    }

    if (!data || typeof data.classification !== "string") {
      return unavailable("Respons IsThisSpam tidak dikenali.");
    }

    const confidence = Number(data.confidence);
    const result = {
      provider: "isthisspam",
      available: true,
      classification: data.classification,
      isSpam: Boolean(data.isSpam),
      confidence: Number.isFinite(confidence)
        ? Math.min(Math.max(confidence, 0), 1)
        : null,
      reasons: normalizeArray(data.reasons),
      recommendations: normalizeArray(data.recommendations),
      usage: data.usage && typeof data.usage === "object"
        ? data.usage
        : null
    };

    writeCache(key, result);

    return result;
  } catch (error) {
    if (error?.name === "TimeoutError") {
      return unavailable("Waktu permintaan IsThisSpam habis.");
    }

    return unavailable(
      "Layanan IsThisSpam tidak dapat dihubungi."
    );
  }
}

export function externalRisk(external) {
  if (!external?.available || !external.isSpam) {
    return { points: 0, severity: "low", label: null };
  }

  const confidence = Number(external.confidence);
  const confident =
    !Number.isFinite(confidence) || confidence >= 0.6;

  if (external.classification === "Spam") {
    return confident
      ? { points: 4, severity: "medium", label: "Spam" }
      : { points: 2, severity: "low", label: "Spam" };
  }

  return confident
    ? {
        points: 7,
        severity: "high",
        label: external.classification
      }
    : {
        points: 4,
        severity: "medium",
        label: external.classification
      };
}

export function externalFinding(external) {
  const risk = externalRisk(external);

  if (risk.points === 0) {
    return null;
  }

  const confidence = Number(external.confidence);
  const percentage = Number.isFinite(confidence)
    ? `, keyakinan ${Math.round(confidence * 100)}%`
    : "";

  return {
    severity: risk.severity,
    points: risk.points,
    message:
      `IsThisSpam menilai "${external.classification}"` +
      `${percentage}.`
  };
}
