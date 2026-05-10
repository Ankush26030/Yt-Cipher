/**
 * POST /decrypt_signature handler.
 */

import { getSolvers } from "../solver.js";
import { log } from "../logger.js";

export async function handleDecryptSignature(ctx) {
  const { encrypted_signature, n_param } = ctx.body;

  const solvers = await getSolvers(ctx.playerScript);
  if (!solvers) {
    log.error("Failed to generate solvers", { playerUrl: ctx.playerScript?.toUrl() });
    return { status: 500, body: { error: "Failed to generate solvers from player script" } };
  }

  let decrypted_signature = "";
  if (encrypted_signature && solvers.sig) {
    decrypted_signature = solvers.sig(encrypted_signature);
  }

  let decrypted_n_sig = "";
  if (n_param && solvers.n) {
    decrypted_n_sig = solvers.n(n_param);
  }

  return { status: 200, body: { decrypted_signature, decrypted_n_sig } };
}
