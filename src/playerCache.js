/**
 * Disk-based cache for YouTube player script files.
 */

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { config } from "./config.js";
import { log } from "./logger.js";

// ─── Cache Directory ─────────────────────────────────────────────────────────

function resolveCacheDir() {
  // Use a local cache directory relative to the project
  return path.join(process.cwd(), "player_cache");
}

export const CACHE_DIR = resolveCacheDir();

// ─── Cache Operations ────────────────────────────────────────────────────────

export async function getPlayerFilePath(playerScript) {
  const playerUrl = playerScript.toUrl();

  let cacheKey;
  if (config.ignoreScriptRegion) {
    cacheKey = playerScript.id;
  } else {
    cacheKey = crypto.createHash("sha256").update(playerUrl).digest("hex");
  }

  const filePath = path.join(CACHE_DIR, `${cacheKey}.js`);

  try {
    const stat = await fs.stat(filePath);
    // Touch access time
    try {
      await fs.utimes(filePath, new Date(), stat.mtime ?? new Date());
    } catch {
      // ignore if utimes fails
    }
    return filePath;
  } catch (error) {
    if (error.code === "ENOENT") {
      log.info("Cache miss for player script, fetching...", { playerUrl, cacheKey });

      const response = await fetch(playerUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch player script from ${playerUrl}: ${response.status} ${response.statusText}`);
      }

      const playerContent = await response.text();
      await fs.writeFile(filePath, playerContent, "utf-8");
      log.info("Saved player script to cache", { filePath });
      return filePath;
    }
    throw error;
  }
}

// ─── Cache Initialization ────────────────────────────────────────────────────

export async function initializeCache() {
  await fs.mkdir(CACHE_DIR, { recursive: true });

  const staleMs = config.cacheStalenessDays * 24 * 60 * 60 * 1000;
  let fileCount = 0;
  let cleaned = 0;

  log.info("Cleaning up player cache directory", { path: CACHE_DIR });

  try {
    const entries = await fs.readdir(CACHE_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) {
        const filePath = path.join(CACHE_DIR, entry.name);
        const stat = await fs.stat(filePath);
        const lastAccessed = stat.atimeMs || stat.mtimeMs || stat.birthtimeMs;

        if (lastAccessed && Date.now() - lastAccessed > staleMs) {
          log.debug("Deleting stale cache file", { filePath });
          await fs.unlink(filePath);
          cleaned++;
        } else {
          fileCount++;
        }
      }
    }
  } catch {
    // Directory might be empty or not exist yet
  }

  log.info("Player cache initialized", { path: CACHE_DIR, activeFiles: fileCount, cleaned });
}
