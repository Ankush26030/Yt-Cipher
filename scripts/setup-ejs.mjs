/**
 * Post-install script:
 *   1. Clones ejs from GitHub (if not present)
 *   2. Compiles all .ts files to .js using esbuild
 *   3. Fixes imports inside .js files (.ts → .js)
 */

import { execSync } from "node:child_process";
import { existsSync, readdirSync, statSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const EJS_DIR = join(process.cwd(), "ejs");
const EJS_COMMIT = "cd4e87f52e87ab6d8b318fd3a817adda6fafa8dc";

// ─── Step 1: Clone ejs ──────────────────────────────────────────

if (existsSync(EJS_DIR)) {
  console.log("[SETUP] ejs/ already exists, skipping clone.");
} else {
  console.log("[SETUP] Cloning yt-dlp/ejs from GitHub...");
  try {
    execSync("git clone https://github.com/yt-dlp/ejs.git", {
      stdio: "inherit",
      cwd: process.cwd(),
    });
    execSync(`git checkout ${EJS_COMMIT}`, {
      stdio: "inherit",
      cwd: EJS_DIR,
    });
    console.log("[SETUP] ejs cloned successfully.");
  } catch (err) {
    console.error("[SETUP] Failed to clone ejs:", err.message);
    process.exit(1);
  }
}

// ─── Step 2: Find all .ts files ─────────────────────────────────

function findTsFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...findTsFiles(full));
    } else if (entry.endsWith(".ts") && !entry.endsWith(".d.ts")) {
      files.push(full);
    }
  }
  return files;
}

// ─── Step 3: Compile and fix imports ────────────────────────────

const srcDir = join(EJS_DIR, "src");
if (existsSync(srcDir)) {
  const tsFiles = findTsFiles(srcDir);

  // Check if already compiled AND patched
  const markerFile = join(EJS_DIR, ".compiled");
  if (existsSync(markerFile)) {
    console.log("[SETUP] ejs already compiled and patched, skipping.");
  } else {
    console.log(`[SETUP] Compiling ${tsFiles.length} TypeScript files...`);

    // Step 3a: Compile each .ts → .js with esbuild
    for (const tsFile of tsFiles) {
      const jsFile = tsFile.replace(".ts", ".js");
      try {
        execSync(
          `npx esbuild "${tsFile}" --outfile="${jsFile}" --format=esm --platform=node`,
          { stdio: "pipe", cwd: process.cwd() }
        );
      } catch (err) {
        console.error(`  Failed: ${tsFile}`, err.stderr?.toString() || err.message);
      }
    }

    // Step 3b: Fix imports in compiled .js files (.ts → .js)
    console.log("[SETUP] Fixing import paths in compiled files...");
    const jsFiles = tsFiles.map((f) => f.replace(".ts", ".js"));
    for (const jsFile of jsFiles) {
      if (existsSync(jsFile)) {
        let content = readFileSync(jsFile, "utf-8");
        // Replace: from "./something.ts" → from "./something.js"
        // Replace: from "../something.ts" → from "../something.js"
        content = content.replace(/(from\s+["'])(\.\.?\/[^"']+)\.ts(["'])/g, "$1$2.js$3");
        writeFileSync(jsFile, content, "utf-8");
      }
    }

    // Mark as done so we don't redo this
    writeFileSync(markerFile, "compiled", "utf-8");
    console.log("[SETUP] Compilation and patching complete.");
  }
}

console.log("[SETUP] Ready!");
