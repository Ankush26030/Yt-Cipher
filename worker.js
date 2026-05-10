/**
 * Worker thread entry point (Node.js worker_threads).
 * Preprocesses raw YouTube player scripts using ejs.
 */

import { parentPort } from "node:worker_threads";
import { preprocessPlayer } from "./ejs/src/yt/solver/solvers.js";

parentPort.on("message", (rawPlayerScript) => {
  try {
    const output = preprocessPlayer(rawPlayerScript);
    parentPort.postMessage({ type: "success", data: output });
  } catch (error) {
    parentPort.postMessage({
      type: "error",
      data: { message: error instanceof Error ? error.message : String(error) },
    });
  }
});
