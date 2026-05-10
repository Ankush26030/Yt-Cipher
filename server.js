/**
 * yt-cipher — YouTube Player Signature Deciphering API
 *
 * A self-hosted web API compatible with Lavalink's remoteCipher protocol.
 * Designed to run on Pterodactyl Node.js egg.
 */

import http from "node:http";
import { config } from "./src/config.js";
import { log } from "./src/logger.js";
import { initializeCache } from "./src/playerCache.js";
import { checkAuth } from "./src/middleware/auth.js";
import { withPlayer } from "./src/middleware/player.js";
import { withMetrics } from "./src/middleware/metrics.js";
import { withValidation } from "./src/validation.js";
import { handleDecryptSignature } from "./src/handlers/decryptSignature.js";
import { handleGetSts } from "./src/handlers/getSts.js";
import { handleResolveUrl } from "./src/handlers/resolveUrl.js";
import { getDashboardHtml } from "./src/dashboard.js";

// ─── Stats Tracking ─────────────────────────────────────────────────────────

const serverStartTime = Date.now();
const stats = { totalRequests: 0, successfulRequests: 0, failedRequests: 0 };

// ─── Response Helpers ────────────────────────────────────────────────────────

function sendJson(res, status, body, extraHeaders = {}) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(json),
    ...extraHeaders,
  });
  res.end(json);
}

function sendHtml(res, html) {
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Length": Buffer.byteLength(html),
  });
  res.end(html);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

// ─── Request Handler ─────────────────────────────────────────────────────────

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // ── Dashboard (browser)
  if (req.method === "GET" && pathname === "/") {
    return sendHtml(res, getDashboardHtml({ stats, config, serverStartTime }));
  }

  // ── Health check (API/JSON)
  if (req.method === "GET" && pathname === "/health") {
    return sendJson(res, 200, {
      status: "ok",
      service: "yt-cipher",
      uptime: Math.floor((Date.now() - serverStartTime) / 1000),
      stats,
      endpoints: ["/decrypt_signature", "/get_sts", "/resolve_url"],
    });
  }

  stats.totalRequests++;

  // ── Authentication
  const authError = checkAuth(req);
  if (authError) {
    stats.failedRequests++;
    return sendJson(res, authError.status, authError.body);
  }

  // ── Route matching
  let handler;
  if (pathname === "/decrypt_signature") {
    handler = handleDecryptSignature;
  } else if (pathname === "/get_sts") {
    handler = handleGetSts;
  } else if (pathname === "/resolve_url") {
    handler = handleResolveUrl;
  } else {
    stats.failedRequests++;
    return sendJson(res, 404, { error: "Not Found" });
  }

  if (req.method !== "POST") {
    stats.failedRequests++;
    return sendJson(res, 405, { error: "Method Not Allowed. Use POST." });
  }

  // ── Parse body
  let body;
  try {
    const raw = await readBody(req);
    body = JSON.parse(raw);
  } catch {
    stats.failedRequests++;
    return sendJson(res, 400, { error: "Invalid JSON body." });
  }

  // ── Execute handler
  const ctx = { req, body, pathname, method: req.method };
  const composedHandler = withValidation(withPlayer(withMetrics(handler)));

  try {
    const result = await composedHandler(ctx);
    stats.successfulRequests++;
    sendJson(res, result.status, result.body, result.headers || {});
  } catch (e) {
    stats.failedRequests++;
    log.error("Unhandled server error", { error: e.message, pathname });
    sendJson(res, 500, { error: e.message });
  }
}

// ─── Server Startup ──────────────────────────────────────────────────────────

log.info("Starting yt-cipher server...");
await initializeCache();

log.info("Configuration loaded", {
  port: config.port,
  host: config.host,
  authEnabled: !!config.apiToken,
  preprocessedCacheSize: config.preprocessedCacheSize,
  overrideVariant: config.overridePlayerVariant || "(none)",
  overridePlayerId: config.overridePlayerId || "(none)",
});

const server = http.createServer(handleRequest);

server.listen(config.port, config.host, () => {
  log.info(`Server listening on http://${config.host}:${config.port}`);
  log.info("Ready for Lavalink remoteCipher connections!");
});
