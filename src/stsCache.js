import { LRUCache } from "./lruCache.js";
import { config } from "./config.js";

export const stsCache = new LRUCache("sts", config.stsCacheSize);
