/**
 * Player URL parsing middleware.
 */

import { getPlayerScript } from "../player.js";

export function withPlayer(handler) {
  return async (ctx) => {
    try {
      if (!ctx.body.player_url) {
        return { status: 400, body: { error: "player_url is required" } };
      }
      ctx.playerScript = getPlayerScript(ctx.body.player_url);
      return await handler(ctx);
    } catch (e) {
      return { status: 400, body: { error: `Player script error: ${e.message}` } };
    }
  };
}
