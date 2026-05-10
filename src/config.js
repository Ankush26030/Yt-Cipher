/**
 * Centralized configuration loaded from config.json.
 * All settings have sensible defaults for Pterodactyl hosting.
 * Zero dependency on environment variables — reads config.json only.
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Load config.json ──────────────────────────────────────────────────────

let fileConfig = {};
try {
  const raw = readFileSync(join(__dirname, "..", "config.json"), "utf-8");
  fileConfig = JSON.parse(raw);
} catch {
  // config.json missing or invalid — fall back to defaults
}

// ─── Helper to dig into nested config ──────────────────────────────────────

function get(section, key, fallback) {
  const val = fileConfig?.[section]?.[key];
  return val !== undefined && val !== null && val !== "" ? val : fallback;
}

// ─── Exported config object ────────────────────────────────────────────────

export const config = {
  /** Port to listen on */
  port: get("server", "port", 8001),

  /** Hostname to bind to */
  host: get("server", "host", "0.0.0.0"),

  /** Optional API token for authentication */
  apiToken: get("auth", "apiToken", ""),

  /** Worker threads for preprocessing */
  maxThreads: get("workers", "maxThreads", 0) || os.cpus().length || 1,

  /** Cache sizes */
  preprocessedCacheSize: get("cache", "preprocessedCacheSize", 150),
  stsCacheSize: get("cache", "stsCacheSize", 150),
  solverCacheSize: get("cache", "solverCacheSize", 150),

  /** Player overrides */
  overridePlayerId: get("player", "overridePlayerId", ""),
  overridePlayerVariant: get("player", "overridePlayerVariant", ""),

  /** Ignore regional differences in player scripts */
  ignoreScriptRegion: get("player", "ignoreScriptRegion", false),

  /** Days before cached player scripts are cleaned */
  cacheStalenessDays: get("cache", "cacheStalenessDays", 14),
};

