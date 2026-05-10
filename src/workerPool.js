/**
 * Worker thread pool using Node.js worker_threads.
 */

import { Worker } from "node:worker_threads";
import { config } from "./config.js";
import { log } from "./logger.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const workers = [];
const taskQueue = [];

function dispatch() {
  const idleWorker = workers.find((w) => w._idle);
  if (!idleWorker || taskQueue.length === 0) return;

  const task = taskQueue.shift();
  idleWorker._idle = false;

  const onMessage = (result) => {
    idleWorker.removeListener("message", onMessage);
    idleWorker.removeListener("error", onError);
    idleWorker._idle = true;

    if (result.type === "success") {
      task.resolve(result.data);
    } else {
      log.error("Worker returned error", { message: result.data?.message });
      task.reject(new Error(result.data?.message ?? "Unknown worker error"));
    }
    dispatch();
  };

  const onError = (err) => {
    idleWorker.removeListener("message", onMessage);
    idleWorker.removeListener("error", onError);
    idleWorker._idle = true;
    task.reject(err);
    dispatch();
  };

  idleWorker.on("message", onMessage);
  idleWorker.on("error", onError);
  idleWorker.postMessage(task.data);
}

export function execInPool(data) {
  return new Promise((resolve, reject) => {
    taskQueue.push({ data, resolve, reject });
    dispatch();
  });
}

export function initializeWorkers() {
  const concurrency = config.maxThreads;
  const workerPath = path.join(__dirname, "..", "worker.js");

  for (let i = 0; i < concurrency; i++) {
    const worker = new Worker(workerPath, {
      execArgv: ["--import", "tsx"],
    });
    worker._idle = true;
    workers.push(worker);
  }

  log.info("Worker pool initialized", { threads: concurrency });
}
