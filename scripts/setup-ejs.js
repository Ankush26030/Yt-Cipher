/**
 * Setup script — clones and patches the ejs dependency.
 * Run once before starting the server:
 *   node scripts/setup-ejs.js
 */

import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const EJS_DIR = path.join(process.cwd(), "ejs");
const EJS_COMMIT = "cd4e87f52e87ab6d8b318fd3a817adda6fafa8dc";

async function dirExists(dir) {
  try {
    const stat = await fs.stat(dir);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function main() {
  console.log("=== yt-cipher EJS Setup ===\n");

  // Step 1: Clone ejs if not present
  if (await dirExists(EJS_DIR)) {
    console.log("✓ ejs/ directory already exists, skipping clone.");
  } else {
    console.log("Cloning yt-dlp/ejs...");
    execSync(`git clone https://github.com/yt-dlp/ejs.git`, { stdio: "inherit", cwd: process.cwd() });
    console.log(`Checking out commit ${EJS_COMMIT}...`);
    execSync(`git checkout ${EJS_COMMIT}`, { stdio: "inherit", cwd: EJS_DIR });
    console.log("✓ ejs cloned successfully.\n");
  }

  // Step 2: Patch ejs — convert .ts extensions to .js in imports
  console.log("Patching ejs source files for Node.js compatibility...");
  let patchCount = 0;

  async function patchDir(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await patchDir(fullPath);
      } else if (entry.name.endsWith(".ts")) {
        let content = await fs.readFile(fullPath, "utf-8");
        let changed = false;

        // Replace .ts imports with .js for Node.js ESM
        const tsImportPattern = /(from\s+["'])(\.\.?\/[^"']+)\.ts(["'])/g;
        if (tsImportPattern.test(content)) {
          content = content.replace(tsImportPattern, "$1$2.js$3");
          changed = true;
        }

        // Create .js copies of .ts files so Node.js can import them
        if (changed) {
          await fs.writeFile(fullPath, content, "utf-8");
          patchCount++;
        }

        // Create a .js copy for Node.js to import
        const jsPath = fullPath.replace(/\.ts$/, ".js");
        try {
          await fs.stat(jsPath);
        } catch {
          await fs.copyFile(fullPath, jsPath);
        }
      }
    }
  }

  await patchDir(path.join(EJS_DIR, "src"));
  console.log(`✓ Patched ${patchCount} files.\n`);

  // Step 3: Install npm dependencies
  console.log("Installing npm dependencies...");
  execSync("npm install", { stdio: "inherit", cwd: process.cwd() });
  console.log("\n✓ Setup complete!");
  console.log("\nStart the server with:");
  console.log("  node server.js\n");
}

main().catch((err) => {
  console.error("Setup failed:", err.message);
  process.exit(1);
});
