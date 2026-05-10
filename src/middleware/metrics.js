/**
 * Request timing and error handling middleware.
 */

import { log } from "../logger.js";

export function withMetrics(handler) {
  return async (ctx) => {
    const playerId = ctx.playerScript?.id ?? "unknown";
    const playerType = ctx.playerScript?.variant ?? "unknown";
    const start = performance.now();

    let result;
    try {
      result = await handler(ctx);
    } catch (e) {
      log.error("Unhandled error in request handler", {
        pathname: ctx.pathname,
        playerId,
        playerType,
        error: e.message,
      });
      result = { status: 500, body: { error: e.message } };
    }

    const durationMs = (performance.now() - start).toFixed(2);
    log.info(`${ctx.method} ${ctx.pathname} → ${result.status}`, {
      durationMs,
      playerId,
      playerType,
    });

    return result;
  };
}
