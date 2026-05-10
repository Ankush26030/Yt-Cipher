# yt-cipher

A self-hosted web API for deciphering YouTube player signature data. Built with **Node.js** and powered by [yt-dlp/ejs](https://github.com/yt-dlp/ejs).

Drop-in remote cipher server for [Lavalink's youtube-source](https://github.com/lavalink-devs/youtube-source) plugin.

---

## Features

- **Decrypt signatures** — decipher the `s` parameter from YouTube stream URLs
- **Decrypt n parameter** — solve the throttling challenge
- **Extract signature timestamp** — get the `sts` value from any player script
- **Resolve full URLs** — combine all above into a ready-to-play stream URL
- **Multi-layer caching** — disk cache + LRU caches for fast repeated requests
- **Worker threads** — parallel player script processing
- **Optional auth** — protect with a token or leave open for local use
- **Pterodactyl ready** — works on any Node.js hosting panel

---

## Quick Start (Pterodactyl Panel)

### Step 1: Create a Node.js Server
- Create a new server with a **Node.js** egg (Node.js 18+ required)
- Set the **Startup Command** to: `node server.js`

### Step 2: Upload Files
1. Go to your server in the Pterodactyl panel
2. Click **Files** (the File Manager tab)
3. Delete any default files that came with the egg
4. Click **Upload** and select all the project files
   - You can also drag and drop files into the file manager
   - Make sure to upload the folders (`src/`, `scripts/`) with their contents
   - Also upload `config.json` and `package.json`

### Step 3: Edit config.json
Open **config.json** in the File Manager and set your values:

```json
{
  "server": { "port": 3006, "host": "0.0.0.0" },
  "auth": { "apiToken": "your_secret_password" },
  "workers": { "maxThreads": 1 },
  "cache": { "preprocessedCacheSize": 30, "stsCacheSize": 30, "solverCacheSize": 30, "cacheStalenessDays": 7 },
  "player": { "overridePlayerId": "", "overridePlayerVariant": "IAS", "ignoreScriptRegion": false }
}
```

> **Tip:** Set `server.port` to match your Pterodactyl allocation port.

### Step 4: Start the Server
Click **Start** in the panel. The first time it will automatically:
1. Clone the ejs cipher engine from GitHub
2. Install npm dependencies
3. Start the server

You should see in the console:
```
[SETUP] Cloning yt-dlp/ejs...
[SETUP] Dependencies installed.
[SETUP] Setup complete!
[INFO] Starting yt-cipher server...
[INFO] Configuration loaded {"port":3006,"host":"0.0.0.0","authEnabled":false,...}
[INFO] Server listening on http://0.0.0.0:3006
[INFO] Ready for Lavalink remoteCipher connections!
```

> Next time you start, setup is skipped and server starts instantly.

✅ Done! Your cipher server is running.

---

## Quick Start (Local / VPS)

```bash
# Clone the project
git clone https://github.com/your-user/yt-cipher.git
cd yt-cipher

# Run setup (clones ejs + installs dependencies)
node scripts/setup-ejs.mjs

# Start the server
node server.js
```

---

## Lavalink Configuration

Add this to your Lavalink `application.yml`:

```yaml
plugins:
  youtube:
    enabled: true
    clients:
      - MUSIC
      - ANDROID_VR
      - WEB
      - WEBEMBEDDED
    remoteCipher:
      url: "http://your-server-ip:8001"  # Your yt-cipher URL
      password: "your_secret_token"       # Must match apiToken in config.json
```

**Without authentication** (local testing):

```yaml
plugins:
  youtube:
    remoteCipher:
      url: "http://localhost:8001"
```

---

## API Endpoints

### `GET /` — Dashboard

Opening the root URL in a browser shows a premium visual dashboard with:
- Server uptime, request stats, success rate
- Node.js version, auth status, player variant
- API endpoint listing

---

### `GET /health` — Health Check (JSON)

```bash
curl http://localhost:8001/health
```

```json
{
  "status": "ok",
  "service": "yt-cipher",
  "uptime": 3600,
  "stats": { "totalRequests": 42, "successfulRequests": 40, "failedRequests": 2 },
  "endpoints": ["/decrypt_signature", "/get_sts", "/resolve_url"]
}
```

---

### `POST /decrypt_signature`

```bash
curl -X POST http://localhost:8001/decrypt_signature \
  -H "Content-Type: application/json" \
  -H "Authorization: your_secret_token" \
  -d '{
    "encrypted_signature": "AABBCCDDeeff...",
    "n_param": "abc123def456",
    "player_url": "https://www.youtube.com/s/player/abcd1234/player_ias.vflset/en_US/base.js"
  }'
```

**Response:**
```json
{
  "decrypted_signature": "decrypted_value_here",
  "decrypted_n_sig": "decrypted_n_value_here"
}
```

---

### `POST /get_sts`

```bash
curl -X POST http://localhost:8001/get_sts \
  -H "Content-Type: application/json" \
  -d '{ "player_url": "https://www.youtube.com/s/player/abcd1234/player_ias.vflset/en_US/base.js" }'
```

**Response:**
```json
{ "sts": "20073" }
```

---

### `POST /resolve_url`

```bash
curl -X POST http://localhost:8001/resolve_url \
  -H "Content-Type: application/json" \
  -d '{
    "stream_url": "https://rr1---sn-abc.googlevideo.com/videoplayback?expire=...&s=encrypted_sig&n=throttle_token...",
    "player_url": "https://www.youtube.com/s/player/abcd1234/player_ias.vflset/en_US/base.js",
    "encrypted_signature": "AABBCCDDeeff...",
    "n_param": "abc123def456"
  }'
```

**Response:**
```json
{ "resolved_url": "https://rr1---sn-abc.googlevideo.com/videoplayback?..." }
```

---

## Configuration (config.json)

All settings are in `config.json` at the project root. Here's a detailed guide:

```jsonc
{
  // ─── Server Port ─────────────────────────────────────────────────
  // The port your cipher server listens on.
  // Set this to match your Pterodactyl allocation port.
  // Default: 8001
  "server": {
    "port": 3006,
    "host": "0.0.0.0"
  },

  // ─── Password ────────────────────────────────────────────────────
  // This is the PASSWORD to protect your cipher server.
  // Set any password here. Example: "MySecret123"
  // This SAME password must be set in your Lavalink application.yml
  // under remoteCipher → password
  //
  // Leave EMPTY ("") if you don't want a password (not recommended)
  //
  // Then in Lavalink application.yml:
  //   remoteCipher:
  //     url: "http://your-server:port"
  //     password: "MySecret123"    ← same password
  "auth": {
    "apiToken": ""
  },

  // ─── Workers ─────────────────────────────────────────────────────
  // How many threads to use for processing.
  // Set to 1 if you have 50% CPU or limited resources.
  // More threads = more CPU usage. 1 is safe for limited CPU.
  // Set to 0 to auto-detect based on CPU cores.
  "workers": {
    "maxThreads": 1
  },

  // ─── Caching ─────────────────────────────────────────────────────
  // Cache sizes control how many items are stored in memory.
  // Lower values = less RAM usage. Higher values = faster responses.
  // Default is 150 — set to 30 if you only have 1GB RAM.
  //
  // cacheStalenessDays: delete old cached player scripts after X days
  // (saves disk space)
  "cache": {
    "preprocessedCacheSize": 30,
    "stsCacheSize": 30,
    "solverCacheSize": 30,
    "cacheStalenessDays": 7
  },

  // ─── Player Variant ──────────────────────────────────────────────
  // overridePlayerVariant: Keep this as "IAS" — it works best.
  //   Don't change unless you know what you're doing.
  //   Options: IAS, IAS_TCC, IAS_TCE, ES5, ES6, TV, PHONE, EMBED
  //
  // overridePlayerId: Force a specific 8-char player ID.
  //   Leave empty ("") for automatic detection.
  //
  // ignoreScriptRegion: Set to true to ignore regional differences
  //   in player scripts (en_US, de_DE, etc.)
  "player": {
    "overridePlayerId": "",
    "overridePlayerVariant": "IAS",
    "ignoreScriptRegion": false
  }
}
```

### Quick Reference Table

| Section | Key | Default | Description |
|---|---|---|---|
| `server` | `port` | `8001` | Port to listen on |
| `server` | `host` | `0.0.0.0` | Hostname to bind |
| `auth` | `apiToken` | *(empty)* | Auth token. Empty = auth disabled. |
| `workers` | `maxThreads` | CPU cores | Worker thread count |
| `cache` | `preprocessedCacheSize` | `150` | Preprocessed data cache entries |
| `cache` | `stsCacheSize` | `150` | Signature timestamp cache entries |
| `cache` | `solverCacheSize` | `150` | Solver function cache entries |
| `cache` | `cacheStalenessDays` | `14` | Days before cached scripts are cleaned |
| `player` | `overridePlayerId` | *(empty)* | Force a player script ID (8 chars) |
| `player` | `overridePlayerVariant` | *(empty)* | Force a player variant (recommended: `IAS`) |
| `player` | `ignoreScriptRegion` | `false` | Ignore regional differences |


---

## Error Responses

| Status | Meaning |
|---|---|
| `400` | Bad request (missing/invalid fields) |
| `401` | Unauthorized (missing/invalid token) |
| `404` | Not found |
| `405` | Wrong HTTP method |
| `500` | Internal error |

All errors return JSON: `{"error": "description"}`

---

## Updating

YouTube changes its cipher scripts periodically. To update:

```bash
# In your server console:
cd ejs
git fetch origin
git checkout origin/main
cd ..
node scripts/setup-ejs.mjs
```

Then restart the server.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Server won't start | Make sure you ran `node scripts/setup-ejs.mjs` first |
| `git` not found | Ask your Pterodactyl host to enable git in the egg |
| Cipher fails | Set `overridePlayerVariant` to `"IAS"` in config.json |
| `Failed to fetch player script` | Check network/DNS. YouTube must be reachable. |
| `Worker pool preprocessing failed` | Update ejs: `cd ejs && git pull && cd ..` |
| High memory | Lower `preprocessedCacheSize` and `solverCacheSize` in config.json |

---

## Project Structure

```
yt-cipher/
├── server.js                  # HTTP server entry point
├── worker.js                  # Worker thread for ejs processing
├── package.json               # Node.js dependencies
├── config.json                # All configuration settings
├── .gitignore                 # Git ignore rules
├── LICENSE                    # Proprietary license
├── README.md                  # Project documentation
├── scripts/
│   ├── setup-ejs.js           # Setup script (CommonJS)
│   └── setup-ejs.mjs          # Setup script (ESM, recommended)
├── ejs/                       # yt-dlp/ejs (cloned by setup)
├── player_cache/              # Cached player scripts (auto-created)
└── src/
    ├── config.js              # Configuration loader
    ├── dashboard.js           # Premium web dashboard (HTML generator)
    ├── logger.js              # Structured logging
    ├── lruCache.js            # Generic LRU cache
    ├── player.js              # Player URL parser
    ├── playerCache.js         # Disk-based player cache
    ├── solver.js              # Cipher solver orchestrator
    ├── workerPool.js          # Worker thread pool
    ├── stsCache.js            # Timestamp cache
    ├── preprocessedCache.js   # Preprocessed data cache
    ├── solverCache.js         # Solver function cache
    ├── validation.js          # Request validation
    ├── middleware/
    │   ├── auth.js            # Token authentication
    │   ├── player.js          # Player URL parsing
    │   └── metrics.js         # Request timing
    └── handlers/
        ├── decryptSignature.js
        ├── getSts.js
        └── resolveUrl.js
```

---

## License

© 2026 Ankush. All Rights Reserved.

This software is **source-visible but not open-source**. You may use yt-cipher as a self-hosted YouTube cipher API, but copying, modifying, or redistributing the source code is prohibited without written permission. See [LICENSE](LICENSE) for full terms.
