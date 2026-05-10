/**
 * Optional token authentication.
 */

import { config } from "../config.js";

export function checkAuth(req) {
  if (!config.apiToken) return null; // Auth disabled

  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return { status: 401, body: { error: "Missing API token. Set the Authorization header." } };
  }

  if (authHeader !== config.apiToken) {
    return { status: 401, body: { error: "Invalid API token" } };
  }

  return null; // Auth passed
}
