import { LRUCache } from "./lruCache.js";
import { config } from "./config.js";

export const preprocessedCache = new LRUCache("preprocessed", config.preprocessedCacheSize);
