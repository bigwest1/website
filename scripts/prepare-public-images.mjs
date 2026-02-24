#!/usr/bin/env node

import { cp, lstat, rm } from "node:fs/promises";
import path from "node:path";

const isVercel = process.env.VERCEL === "1";

if (!isVercel) {
  console.log("[image-prep] Skipping image preparation outside Vercel.");
  process.exit(0);
}

const publicImagesDir = path.join(process.cwd(), "public", "images");
const sourceImagesDir = path.join(process.cwd(), "images");

const stat = await lstat(publicImagesDir).catch(() => null);

if (!stat) {
  await cp(sourceImagesDir, publicImagesDir, { recursive: true, force: true });
  console.log("[image-prep] Created public/images from images.");
  process.exit(0);
}

if (stat.isSymbolicLink()) {
  await rm(publicImagesDir, { force: true, recursive: true });
  await cp(sourceImagesDir, publicImagesDir, { recursive: true, force: true });
  console.log("[image-prep] Replaced public/images symlink with copied directory.");
  process.exit(0);
}

console.log("[image-prep] public/images already a real directory.");
