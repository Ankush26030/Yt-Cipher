/**
 * POST /get_sts handler.
 */

import fs from "node:fs/promises";
import { getPlayerFilePath } from "../playerCache.js";
import { stsCache } from "../stsCache.js";

export async function handleGetSts(ctx) {
  const playerFilePath = await getPlayerFilePath(ctx.playerScript);

  // Check cache
  const cachedSts = stsCache.get(playerFilePath);
  if (cachedSts) {
    return { status: 200, body: { sts: cachedSts }, headers: { "X-Cache-Hit": "true" } };
  }

  // Read player script and extract timestamp
  const playerContent = await fs.readFile(playerFilePath, "utf-8");

  const stsPattern = /(signatureTimestamp|sts):(\d+)/;
  const match = playerContent.match(stsPattern);

  if (match && match[2]) {
    const sts = match[2];
    stsCache.set(playerFilePath, sts);
    return { status: 200, body: { sts }, headers: { "X-Cache-Hit": "false" } };
  }

  return { status: 404, body: { error: "Timestamp not found in player script" } };
}
