/**
 * release.mjs — SHARDS release script
 *
 * Usage:
 *   pnpm release           → patch (1.0.0 → 1.0.1)
 *   pnpm release minor     → minor (1.0.0 → 1.1.0)
 *   pnpm release major     → major (1.0.0 → 2.0.0)
 *
 * What it does:
 *   1. Bump version in package.json
 *   2. Sync version + URLs into public/module.json
 *   3. Build (vite)
 *   4. Create zip from dist/
 *   5. Git commit + tag + push
 *
 * GitHub Actions then picks up the tag and creates the GitHub Release
 * with the zip attached automatically.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// ─── Config ───────────────────────────────────────────────────────────────────

const GITHUB_USER = "dev-shua";
const REPO_NAME = "shards-core";
const MODULE_JSON = "public/module.json";
const PKG_JSON = "package.json";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function run(cmd, opts = {}) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { stdio: "inherit", ...opts });
}

function bumpVersion(current, type) {
  const [major, minor, patch] = current.split(".").map(Number);
  switch (type) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const bumpType = process.argv[2] ?? "patch";
if (!["patch", "minor", "major"].includes(bumpType)) {
  console.error(`Unknown bump type: "${bumpType}". Use patch, minor, or major.`);
  process.exit(1);
}

// 1. Bump package.json
const pkg = JSON.parse(fs.readFileSync(PKG_JSON, "utf8"));
const newVersion = bumpVersion(pkg.version, bumpType);
pkg.version = newVersion;
fs.writeFileSync(PKG_JSON, JSON.stringify(pkg, null, 2) + "\n");
console.log(`\n✔ version bumped: ${pkg.version} → ${newVersion}`);

// 2. Sync module.json
const mod = JSON.parse(fs.readFileSync(MODULE_JSON, "utf8"));
const baseUrl = `https://github.com/${GITHUB_USER}/${REPO_NAME}`;
const rawBase = `https://raw.githubusercontent.com/${GITHUB_USER}/${REPO_NAME}`;
mod.version = newVersion;
mod.url = baseUrl;
mod.manifest = `${rawBase}/main/${MODULE_JSON}`;
mod.download = `${baseUrl}/releases/download/v${newVersion}/${REPO_NAME}-v${newVersion}.zip`;
fs.writeFileSync(MODULE_JSON, JSON.stringify(mod, null, 2) + "\n");
console.log(`✔ module.json synced (manifest + download URLs updated)`);

// 3. Build
console.log("\n⚙  Building...");
run("pnpm build");

// 4. Zip
const zipName = `${REPO_NAME}-v${newVersion}.zip`;
const zipPath = path.resolve(zipName);
if (fs.existsSync(zipPath)) fs.rmSync(zipPath);
run(`cd dist && zip -r "${zipPath}" .`);
console.log(`✔ zip created: ${zipName}`);

// 5. Git commit + tag + push
console.log("\n📦 Committing...");
run(`git add ${PKG_JSON} ${MODULE_JSON}`);
run(`git commit -m "chore: release v${newVersion}"`);
run(`git tag v${newVersion}`);
run("git push");
run("git push --tags");

console.log(`\n🚀 Released v${newVersion} — GitHub Actions will now create the GitHub Release.`);
console.log(`   Manifest URL: ${mod.manifest}`);
