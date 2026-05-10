/**
 * Solver orchestrator — multi-layer cache pipeline.
 * Runs ejs preprocessing directly (no worker threads needed).
 */

import fs from "node:fs/promises";
import { getPlayerFilePath } from "./playerCache.js";
import { preprocessedCache } from "./preprocessedCache.js";
import { solverCache } from "./solverCache.js";
import { preprocessPlayer, getFromPrepared } from "../ejs/src/yt/solver/solvers.js";
import { log } from "./logger.js";

export async function getSolvers(playerScript) {
  const playerCacheKey = await getPlayerFilePath(playerScript);

  // Tier 1: Compiled solver functions (instant)
  let solvers = solverCache.get(playerCacheKey);
  if (solvers) return solvers;

  // Tier 2: Preprocessed data cache
  let preprocessedPlayer = preprocessedCache.get(playerCacheKey);
  if (!preprocessedPlayer) {
    const rawPlayer = await fs.readFile(playerCacheKey, "utf-8");
    try {
      // Run preprocessing directly (no worker thread needed)
      preprocessedPlayer = preprocessPlayer(rawPlayer);
    } catch (e) {
      log.error("Preprocessing failed", {
        playerId: playerScript.id,
        variant: playerScript.variant,
        error: e.message,
      });
      throw e;
    }
    preprocessedCache.set(playerCacheKey, preprocessedPlayer);
  }

  // Tier 3: Build solver functions
  const built = getFromPrepared(preprocessedPlayer);
  if (built) {
    solverCache.set(playerCacheKey, built);
    return built;
  }

  log.error("Failed to build solvers from preprocessed data", {
    playerId: playerScript.id,
    variant: playerScript.variant,
  });
  return null;
}
