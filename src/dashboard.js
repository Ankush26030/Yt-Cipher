/**
 * Premium Dashboard HTML generator
 */

export function getDashboardHtml({ stats, config, serverStartTime }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>yt-cipher — Dashboard</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔑</text></svg>">
  <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#050510;--surface:rgba(120,80,255,0.04);--surface-hover:rgba(120,80,255,0.08);
  --border:rgba(140,100,255,0.08);--border-accent:rgba(139,92,246,0.3);
  --text:#eeeef5;--text-dim:#9d9db5;--text-muted:#5b5b78;
  --purple:#a78bfa;--violet:#8b5cf6;--indigo:#6366f1;
  --green:#10b981;--emerald:#34d399;--cyan:#06b6d4;
}
body{font-family:'Outfit',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;overflow-x:hidden;
  background:linear-gradient(170deg,#030308 0%,#06060f 40%,#080412 70%,#030308 100%)}

/* ── Mesh gradient background ── */
.bg-mesh{position:fixed;inset:0;z-index:0;overflow:hidden}
.bg-mesh .orb{position:absolute;border-radius:50%;filter:blur(140px);animation:orbFloat 25s ease-in-out infinite}
.bg-mesh .orb:nth-child(1){width:700px;height:700px;background:#7c3aed;opacity:.07;top:-15%;left:15%;animation-delay:0s}
.bg-mesh .orb:nth-child(2){width:500px;height:500px;background:#06b6d4;opacity:.05;top:35%;right:-8%;animation-delay:-8s}
.bg-mesh .orb:nth-child(3){width:550px;height:550px;background:#a855f7;opacity:.05;bottom:-15%;left:-8%;animation-delay:-16s}
.bg-mesh .orb:nth-child(4){width:300px;height:300px;background:#3b82f6;opacity:.04;top:10%;right:25%;animation-delay:-12s}
@keyframes orbFloat{
  0%,100%{transform:translate(0,0) scale(1)}
  25%{transform:translate(40px,-60px) scale(1.1)}
  50%{transform:translate(-30px,40px) scale(.95)}
  75%{transform:translate(50px,20px) scale(1.05)}
}

/* ── Noise overlay ── */
.noise{position:fixed;inset:0;z-index:1;opacity:.03;pointer-events:none;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}

/* ── Grid lines ── */
.grid-bg{position:fixed;inset:0;z-index:1;
  background-image:linear-gradient(rgba(255,255,255,.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.015) 1px,transparent 1px);
  background-size:80px 80px;mask-image:radial-gradient(ellipse at center,black 30%,transparent 70%)}

.page{position:relative;z-index:2;max-width:960px;margin:0 auto;padding:60px 24px 40px}

/* ── Hero ── */
.hero{text-align:center;margin-bottom:64px}
.hero-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 16px;border-radius:99px;
  background:rgba(139,92,246,.08);border:1px solid rgba(139,92,246,.2);font-size:11px;font-weight:600;
  letter-spacing:1.5px;text-transform:uppercase;color:#a78bfa;margin-bottom:24px}
.hero-badge .dot{width:6px;height:6px;border-radius:50%;background:#a78bfa;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.85)}}

.hero h1{font-family:'Chakra Petch',sans-serif;font-size:clamp(48px,10vw,80px);font-weight:700;letter-spacing:6px;line-height:1;
  text-transform:uppercase;
  background:linear-gradient(180deg,#fff 0%,#c4b5fd 50%,#7c3aed 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:16px;
  filter:drop-shadow(0 0 30px rgba(139,92,246,0.4)) drop-shadow(0 0 60px rgba(139,92,246,0.15))}
.hero p{font-size:16px;color:var(--text-dim);font-weight:400;max-width:400px;margin:0 auto 28px}

/* ── Status pill ── */
.status-pill{display:inline-flex;align-items:center;gap:10px;padding:10px 24px;border-radius:99px;
  background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.2)}
.status-pill .ring{width:12px;height:12px;border-radius:50%;background:var(--green);position:relative}
.status-pill .ring::after{content:'';position:absolute;inset:-4px;border-radius:50%;border:2px solid var(--green);opacity:.3;animation:ringPulse 2s infinite}
@keyframes ringPulse{0%,100%{transform:scale(1);opacity:.3}50%{transform:scale(1.5);opacity:0}}
.status-pill span{font-size:13px;font-weight:600;color:var(--emerald);letter-spacing:.5px}

/* ── Stat cards ── */
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:40px}
.stat{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:24px;
  position:relative;overflow:hidden;transition:all .3s cubic-bezier(.4,0,.2,1);
  backdrop-filter:blur(16px)}
.stat::before{content:'';position:absolute;inset:0;border-radius:16px;padding:1px;
  background:linear-gradient(135deg,rgba(6,182,212,.2) 0%,transparent 40%,rgba(139,92,246,.25) 100%);
  -webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);
  -webkit-mask-composite:xor;mask-composite:exclude;opacity:0;transition:opacity .4s}
.stat:hover{transform:translateY(-4px);background:var(--surface-hover);
  box-shadow:0 12px 40px rgba(139,92,246,.08),0 0 1px rgba(139,92,246,.3)}
.stat:hover::before{opacity:1}
.stat-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.2px;color:var(--text-muted);margin-bottom:10px}
.stat-value{font-size:26px;font-weight:700;font-family:'JetBrains Mono',monospace;
  background:linear-gradient(135deg,#fff,#d4d4d8);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.stat-value.sm{font-size:17px}

/* ── Endpoints ── */
.section-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:var(--text-muted);margin-bottom:14px;padding-left:2px}
.endpoints{background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow:hidden;margin-bottom:40px}
.ep{display:flex;align-items:center;justify-content:space-between;padding:18px 24px;
  border-bottom:1px solid var(--border);transition:background .2s}
.ep:last-child{border-bottom:none}
.ep:hover{background:var(--surface-hover)}
.ep-left{display:flex;align-items:center;gap:14px}
.badge{font-size:10px;font-weight:700;padding:4px 10px;border-radius:6px;font-family:'JetBrains Mono',monospace;letter-spacing:.5px}
.badge.post{background:rgba(139,92,246,.12);color:#a78bfa}
.badge.get{background:rgba(16,185,129,.12);color:#34d399}
.ep-path{font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:500;color:var(--text)}
.ep-desc{font-size:12px;color:var(--text-muted)}

/* ── Footer ── */
.footer{text-align:center;padding:20px 0;color:var(--text-muted);font-size:11px;letter-spacing:.5px}
.footer a{color:var(--text-dim);text-decoration:none;transition:color .2s}
.footer a:hover{color:var(--purple)}

/* ── Responsive ── */
@media(max-width:768px){.stats{grid-template-columns:repeat(2,1fr)}}
@media(max-width:480px){.stats{grid-template-columns:1fr}.page{padding:40px 16px 32px}.hero h1{font-size:36px}}
  </style>
</head>
<body>
  <div class="bg-mesh"><div class="orb"></div><div class="orb"></div><div class="orb"></div><div class="orb"></div></div>
  <div class="noise"></div>
  <div class="grid-bg"></div>

  <div class="page">
    <section class="hero">
      <div class="hero-badge"><span class="dot"></span> REMOTE CIPHER API</div>
      <h1>yt-cipher</h1>
      <p>YouTube Player Signature Deciphering API for Lavalink</p>
      <div class="status-pill">
        <div class="ring"></div>
        <span>All Systems Operational</span>
      </div>
    </section>

    <div class="stats">
      <div class="stat">
        <div class="stat-label">Uptime</div>
        <div class="stat-value" id="uptime">00:00:00</div>
      </div>
      <div class="stat">
        <div class="stat-label">Requests Served</div>
        <div class="stat-value">${stats.totalRequests.toLocaleString()}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Success Rate</div>
        <div class="stat-value">${stats.totalRequests > 0 ? Math.round((stats.successfulRequests / stats.totalRequests) * 100) : 100}%</div>
      </div>
      <div class="stat">
        <div class="stat-label">Runtime</div>
        <div class="stat-value sm">${process.version}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Authentication</div>
        <div class="stat-value sm">${config.apiToken ? "Enabled" : "Open"}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Player Variant</div>
        <div class="stat-value sm">${config.overridePlayerVariant || "Auto"}</div>
      </div>
    </div>

    <div class="section-label">API Endpoints</div>
    <div class="endpoints">
      <div class="ep"><div class="ep-left"><span class="badge post">POST</span><span class="ep-path">/decrypt_signature</span></div><span class="ep-desc">Decrypt player signature</span></div>
      <div class="ep"><div class="ep-left"><span class="badge post">POST</span><span class="ep-path">/get_sts</span></div><span class="ep-desc">Get signature timestamp</span></div>
      <div class="ep"><div class="ep-left"><span class="badge post">POST</span><span class="ep-path">/resolve_url</span></div><span class="ep-desc">Resolve player URL</span></div>
      <div class="ep"><div class="ep-left"><span class="badge get">GET</span><span class="ep-path">/health</span></div><span class="ep-desc">Health check (JSON)</span></div>
    </div>

    <footer class="footer">
      Powered by <a href="https://github.com/yt-dlp/ejs" target="_blank">yt-dlp/ejs</a> &middot; Compatible with <a href="https://github.com/lavalink-devs/youtube-source" target="_blank">Lavalink remoteCipher</a>
    </footer>
  </div>

  <script>
    const st=${serverStartTime};
    !function u(){const e=Math.floor((Date.now()-st)/1000),h=String(Math.floor(e/3600)).padStart(2,'0'),m=String(Math.floor(e%3600/60)).padStart(2,'0'),s=String(e%60).padStart(2,'0');document.getElementById('uptime').textContent=h+':'+m+':'+s;setTimeout(u,1000)}();
  </script>
</body>
</html>`;
}
