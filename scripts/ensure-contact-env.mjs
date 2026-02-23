#!/usr/bin/env node

const required = ["RESEND_API_KEY", "CONTACT_TO"];
const shouldEnforce = process.env.VERCEL === "1" || process.env.STRICT_ENV === "1";

if (!shouldEnforce) {
  console.log("[env-check] Skipping strict contact env validation (set STRICT_ENV=1 to enforce locally).");
  process.exit(0);
}

const missing = required.filter((key) => !process.env[key] || String(process.env[key]).trim().length === 0);

if (missing.length === 0) {
  console.log("[env-check] Required contact env vars are present.");
  process.exit(0);
}

console.error("[env-check] Missing required environment variables:");
for (const key of missing) {
  console.error(`- ${key}`);
}
console.error("[env-check] Configure these in Vercel Project Settings > Environment Variables.");
process.exit(1);
