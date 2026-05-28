import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();

function readFile(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

const requiredDocs = [
  "docs/DEPLOYMENT_READINESS_PLAN.md",
  "docs/PRODUCTION_SAFETY_CHECKLIST.md",
  "docs/SUPABASE_PRODUCTION_CHECKS.md",
  "docs/BACKEND_READINESS_PLAN.md",
  "docs/MEDIA_STORAGE_ARCHITECTURE.md",
];

const requiredScripts = ["dev", "build", "audit:secrets", "audit:deployment"];

const gitignore = readFile(".gitignore");
const packageJson = JSON.parse(readFile("package.json"));
const readme = readFile("README.md");
const appCode = readFile("src/App.jsx");
const supabaseClient = readFile("src/services/supabaseClient.js");
const mediaAssetService = readFile("src/services/mediaAssetService.js");

for (const docPath of requiredDocs) {
  if (exists(docPath)) {
    pass(`Required doc exists: ${docPath}`);
  } else {
    fail(`Missing required doc: ${docPath}`);
  }
}

for (const scriptName of requiredScripts) {
  if (packageJson.scripts?.[scriptName]) {
    pass(`Package script exists: ${scriptName}`);
  } else {
    fail(`Missing package script: ${scriptName}`);
  }
}

if (gitignore.includes(".env.local")) {
  pass(".env.local is gitignored");
} else {
  fail(".env.local is not gitignored");
}

if (gitignore.includes(".env.*.local")) {
  pass(".env.*.local is gitignored");
} else {
  fail(".env.*.local is not gitignored");
}

if (/VITE_SUPABASE_ANON_KEY/.test(supabaseClient) && /createClient\(supabaseUrl,\s*supabaseAnonKey/i.test(supabaseClient)) {
  pass("Frontend Supabase client uses the anon key");
} else {
  fail("Frontend Supabase client anon-key wiring is missing or changed");
}

if (!/service_role/i.test(supabaseClient) && !/SUPABASE_SERVICE_ROLE/i.test(supabaseClient)) {
  pass("No service_role usage found in frontend Supabase client");
} else {
  fail("Found service_role usage in frontend Supabase client");
}

if (/public_url:\s*null/.test(mediaAssetService)) {
  pass("Private media service still keeps public_url unset");
} else {
  fail("public_url no longer appears locked down in mediaAssetService");
}

if (/Public Disabled/.test(appCode) && /Video Private/.test(appCode) && /No direct messaging/.test(appCode)) {
  pass("Public-media-disabled and no-direct-messaging UI markers are present");
} else {
  fail("Expected public-media-disabled or no-direct-messaging markers are missing");
}

if (/mysportsresumeaus@outlook\.com/i.test(readme)) {
  pass("README includes the official support email");
} else {
  fail("README does not include the official support email");
}

if (/public media access remains disabled|public media remains disabled|public media URLs remain disabled/i.test(readme)) {
  pass("README documents that public media stays disabled");
} else {
  fail("README is missing public-media-disabled deployment guidance");
}

if (process.exitCode && process.exitCode !== 0) {
  console.error("Deployment readiness audit failed.");
} else {
  console.log("Deployment readiness audit passed.");
}
