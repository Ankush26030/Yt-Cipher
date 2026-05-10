/**
 * POST /resolve_url handler.
 */

import { getSolvers } from "../solver.js";
import { log } from "../logger.js";

export async function handleResolveUrl(ctx) {
  const { stream_url, encrypted_signature, signature_key, n_param: nParamFromRequest } = ctx.body;

  const solvers = await getSolvers(ctx.playerScript);
  if (!solvers) {
    log.error("Failed to generate solvers", { playerUrl: ctx.playerScript?.toUrl() });
    return { status: 500, body: { error: "Failed to generate solvers from player script" } };
  }

  const url = new URL(stream_url);

  // Decrypt and apply signature
  if (encrypted_signature) {
    if (!solvers.sig) {
      return { status: 500, body: { error: "No signature solver found for this player" } };
    }
    const decryptedSig = solvers.sig(encrypted_signature);
    const sigKey = signature_key || url.searchParams.get("sp") || "sig";
    url.searchParams.set(sigKey, decryptedSig);
    url.searchParams.delete("s");
  }

  // Decrypt and apply n parameter
  let nParam = nParamFromRequest || null;
  if (!nParam) {
    nParam = url.searchParams.get("n");
  }
  if (solvers.n && nParam) {
    const decryptedN = solvers.n(nParam);
    url.searchParams.set("n", decryptedN);
  }

  return { status: 200, body: { resolved_url: url.toString() } };
}
