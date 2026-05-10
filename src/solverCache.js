import { LRUCache } from "./lruCache.js";
import { config } from "./config.js";

export const solverCache = new LRUCache("solver", config.solverCacheSize);
