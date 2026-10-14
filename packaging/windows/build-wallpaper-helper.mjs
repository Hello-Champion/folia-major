#!/usr/bin/env node
// Build the Windows wallpaper helper (Windows desktop wallpaper mode.
//
// Builds the Rust crate in packaging/windows/wallpaper-helper/ with `cargo build --release` and
// copies folia-wallpaper-helper.exe into build/ so electron-builder's win extraResources packages
// it as resources/folia-wallpaper-helper.exe. Mirrors packaging/linux/build-windowtolayer.mjs:
// shared by local `npm run build:electron*` and the CI release workflow, and its output doubles
// as the dev-path override for FOLIA_WALLPAPER_HELPER_PATH (see resolveWallpaperHelperPath in
// electron/main.cjs). No-op on non-Windows hosts (the Linux/macOS build must not depend on a
// Rust Windows toolchain). Like build-windowtolayer.mjs, an up-to-date binary is not rebuilt
// (pass --force to override), so packaging never needs cargo on PATH when the crate is
// unchanged.
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC_DIR = path.join(ROOT, 'packaging', 'windows', 'wallpaper-helper');
const OUT_DIR = path.join(ROOT, 'build');
const OUT_BIN = path.join(OUT_DIR, 'folia-wallpaper-helper.exe');

const force = process.argv.includes('--force');

function run(command, args) {
  execFileSync(command, args, { stdio: 'inherit', cwd: SRC_DIR });
}

// Recursive file listing for the mtime comparison; the crate is small, so a plain walk suffices.
function listFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

// True when the staged binary is at least as new as every crate input (manifest, lockfile,
// sources). An unchanged crate must not re-invoke cargo: that would both stall the build on
// hosts without a Rust toolchain on PATH and rebuild a byte-identical binary.
function isBinaryUpToDate() {
  if (!existsSync(OUT_BIN)) {
    return false;
  }
  const inputs = [
    path.join(SRC_DIR, 'Cargo.toml'),
    path.join(SRC_DIR, 'Cargo.lock'),
    ...listFiles(path.join(SRC_DIR, 'src')),
  ];
  const binaryMtime = statSync(OUT_BIN).mtimeMs;
  return inputs.every((file) => statSync(file).mtimeMs <= binaryMtime);
}

if (process.platform !== 'win32') {
  console.log('[wallpaper-helper] non-Windows host, skipping build');
  process.exit(0);
}

mkdirSync(OUT_DIR, { recursive: true });
run('cargo', ['build', '--release']);
copyFileSync(path.join(SRC_DIR, 'target', 'release', 'folia-wallpaper-helper.exe'), OUT_BIN);
console.log(`[wallpaper-helper] built ${OUT_BIN}`);
