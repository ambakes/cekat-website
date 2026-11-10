
import "dotenv/config";
import express from "express";
import { analyzeUrl } from "./src/scanner.js";
import {
  analyzeMessage,
  messageAdvice,
  riskFromScore
} from "./src/messageAnalyzer.js";
import { analyzeQrContent, qrAdvice } from "./src/qris.js";
import {
  classifyWithIsThisSpam,
  externalFinding
} from "./src/isthisspam.js";

const app = express();

app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    if (!req.path.startsWith("/api")) {
      return;
    }

    console.log(
      `[api] ${req.method} ${req.path} -> ` +
      `${res.statusCode} (${Date.now() - startedAt} ms)`
    );
  });

  next();
});

app.use(express.json({ limit: "64kb" }));

app.use((error, req, res, next) => {
  if (error?.type === "entity.parse.failed") {
    return res.status(400).json({
      error: "Format permintaan tidak valid."
    });
  }

  if (error?.type === "entity.too.large") {
    return res.status(413).json({
      error: "Permintaan terlalu besar."
    });
  }

  return next(error);
});

app.use(express.static("public"));

async function checkReputation(url) {
  const apiKey =
    process.env.GOOGLE_SAFE_BROWSING_API_KEY;

  if (!apiKey) {
    throw new Error("API key belum dikonfigurasi.");
  }

  const response = await fetch(
    `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        client: {
          clientId: "cekat-demo",
          clientVersion: "1.0.0"
        },
        threatInfo: {
          threatTypes: [
            "MALWARE",
            "SOCIAL_ENGINEERING",
            "UNWANTED_SOFTWARE",
            "POTENTIALLY_HARMFUL_APPLICATION"
          ],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url }]
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error("Layanan reputasi sedang gagal.");
  }

  const data = await response.json();
  return data.matches ?? [];
}

async function scanUrl(input, options = {}) {
  const { allowReputationFailure = false } = options;
  const analysis = analyzeUrl(input);
  let matches = [];
  let reputation = "no_known_threat";

  try {
    matches = await checkReputation(input);
  } catch (error) {
    if (!allowReputationFailure) {
      throw error;
    }

    reputation = "unavailable";
  }

  const dangerous = matches.length > 0;

  let status = "unknown";

  if (dangerous) {
    status = "dangerous";
  } else if (analysis.suspicious) {
    status = "suspicious";
  } else if (
    analysis.matchedDomain &&
    analysis.findings.length === 0
  ) {
    status = "safe";
  }

  return {
    status,
    hostname: analysis.hostname,
    matchedDomain: analysis.matchedDomain,
    findings: analysis.findings,
    reputation:
      dangerous ? "threat_detected" : reputation,
    threatTypes: [
      ...new Set(
        matches.map(match => match.threatType)
      )
    ]
  };
}

app.post("/api/scan", async (req, res) => {
  try {
    const input = req.body?.url;

    if (typeof input !== "string" || input.length > 2048) {
      return res.status(400).json({
        error: "URL wajib diisi dan maksimal 2048 karakter."
      });
    }

    const result = await scanUrl(input);

    console.log(
      `[scan] ${result.hostname} -> ${result.status}` +
      (result.status === "safe"
        ? ` (dataset: ${result.matchedDomain})`
        : "") +
      (result.threatTypes.length > 0
        ? ` (${result.threatTypes.join(", ")})`
        : "")
    );

    return res.json(result);
  } catch (error) {
    const message =
      error.message === "Format URL tidak valid." ||
      error.message ===
        "URL harus menggunakan HTTP atau HTTPS."
        ? error.message
        : "Pemeriksaan gagal. Coba lagi nanti.";

    const clientError =
      message === error.message &&
      message !== "Pemeriksaan gagal. Coba lagi nanti.";

    if (!clientError) {
      console.error("[scan] gagal:", error.message);
    }

    return res.status(clientError ? 400 : 502).json({
      error: message
    });
  }
});

app.post("/api/check-message", async (req, res) => {
  try {
    const rawMessage = req.body?.message;

    if (
      typeof rawMessage !== "string" ||
      !rawMessage.trim()
    ) {
      return res.status(400).json({
        error: "Isi pesan wajib diisi."
      });
    }

    if (rawMessage.length > 10000) {
      return res.status(400).json({
        error: "Pesan maksimal 10.000 karakter."
      });
    }

    const analysis = analyzeMessage(rawMessage);
    const findings = [...analysis.findings];
    let score = analysis.score;

    const externalPromise = classifyWithIsThisSpam(
      rawMessage,
      { type: "text" }
    );

    const settled = await Promise.allSettled(
      analysis.urls.map(async url => ({
        url,
        result: await scanUrl(url, {
          allowReputationFailure: true
        })
      }))
    );

    const urls = [];

    for (const item of settled) {
      if (item.status !== "fulfilled") {
        continue;
      }

      const { url, result } = item.value;

      urls.push({
        url,
        status: result.status,
        matchedDomain: result.matchedDomain,
        reputation: result.reputation,
        threatTypes: result.threatTypes
      });

      if (result.status === "dangerous") {
        score += 7;
        findings.push({
          severity: "high",
          message: `Tautan berbahaya terdeteksi (${url}).`
        });
      } else if (result.status === "suspicious") {
        score += 3;
        findings.push({
          severity: "medium",
          message: `Tautan mencurigakan (${url}).`
        });
      }
    }

    const external = await externalPromise;
    const externalResult = externalFinding(external);

    if (externalResult) {
      score += externalResult.points;
      findings.push({
        severity: externalResult.severity,
        message: externalResult.message
      });
    }

    const risk = riskFromScore(score);

    console.log(
      `[message] ${risk} ` +
      `(${findings.length} temuan, ${urls.length} tautan, ` +
      `isthisspam: ${external.available ? external.classification : "unavailable"})`
    );

    return res.json({
      risk,
      score,
      findings,
      urls,
      external,
      advice: messageAdvice(risk, analysis.sensitive)
    });
  } catch (error) {
    console.error("[message] gagal:", error.message);

    return res.status(500).json({
      error: "Pemeriksaan pesan gagal. Coba lagi nanti."
    });
  }
});

app.post("/api/check-qr", async (req, res) => {
  try {
    const content = req.body?.content;

    if (
      typeof content !== "string" ||
      !content.trim()
    ) {
      return res.status(400).json({
        error: "Isi QR wajib diisi."
      });
    }

    if (content.length > 4096) {
      return res.status(400).json({
        error: "Isi QR maksimal 4.096 karakter."
      });
    }

    const analysis = analyzeQrContent(content);
    const findings = [...analysis.findings];
    const urls = [];
    let score = analysis.score;
    let risk = analysis.risk;
    let external = null;

    if (
      analysis.type === "url" &&
      analysis.urls.length > 0
    ) {
      const target = analysis.urls[0];

      const [scan, externalResult] = await Promise.all([
        scanUrl(target, {
          allowReputationFailure: true
        }).catch(() => null),
        classifyWithIsThisSpam(target, { type: "url" })
      ]);

      external = externalResult;

      if (scan) {
        urls.push({
          url: target,
          status: scan.status,
          matchedDomain: scan.matchedDomain,
          reputation: scan.reputation,
          threatTypes: scan.threatTypes
        });

        if (
          scan.status === "dangerous" ||
          scan.status === "suspicious"
        ) {
          // QR hanya berisi tautan tanpa konteks lain, sehingga
          // tautan yang tidak aman langsung berisiko tinggi.
          score += 7;
          findings.push({
            severity: "high",
            message:
              scan.status === "dangerous"
                ? `Tautan berbahaya terdeteksi (${target}).`
                : `Tautan mencurigakan (${target}).`
          });
        }
      }

      const externalFindingResult = externalFinding(external);

      if (externalFindingResult) {
        score += externalFindingResult.points;
        findings.push({
          severity: externalFindingResult.severity,
          message: externalFindingResult.message
        });
      }

      risk = riskFromScore(score);
    }

    console.log(
      `[qr] ${analysis.type} -> ${risk}` +
      (external
        ? ` (isthisspam: ${
            external.available
              ? external.classification
              : "unavailable"
          })`
        : "")
    );

    return res.json({
      type: analysis.type,
      risk,
      score,
      findings,
      urls,
      external,
      qris: analysis.qris ?? null,
      wifi: analysis.wifi ?? null,
      advice: qrAdvice(analysis.type, risk)
    });
  } catch (error) {
    console.error("[qr] gagal:", error.message);

    return res.status(500).json({
      error: "Pemeriksaan QR gagal. Coba lagi nanti."
    });
  }
});

app.use("/api", (req, res) => {
  return res.status(404).json({
    error: "Endpoint tidak ditemukan."
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  console.error(error);

  return res.status(500).json({
    error: "Terjadi kesalahan pada server."
  });
});

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`CEKAT berjalan di http://localhost:${port}`);
});
