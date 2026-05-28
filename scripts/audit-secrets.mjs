import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();

const ignoredDirNames = new Set([
  ".git",
  "node_modules",
  "dist",
  "test-results",
  ".edge-auth-test",
  ".edge-auth-test-2",
  ".edge-mailinator-test",
]);

const ignoredFilePatterns = [
  /^\.env\.local$/i,
  /^\.env\..+\.local$/i,
];

const textFileExtensions = new Set([
  ".css",
  ".env",
  ".example",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".sql",
  ".txt",
  ".jsx",
  ".yml",
  ".yaml",
]);

const safeDocLikeExtensions = new Set([".md"]);

const riskyPatterns = [
  {
    id: "supabase-service-role-assignment",
    test: (content) =>
      /(?:SUPABASE_SERVICE_ROLE|SERVICE_ROLE|VITE_SUPABASE_SERVICE_ROLE)\s*[:=]\s*["']?[^"'\s#][^\r\n#"'` ]*/i.test(
        content,
      ),
  },
  {
    id: "supabase-secret-key",
    test: (content) => /\bsb_secret_[A-Za-z0-9_-]{12,}\b/.test(content),
  },
  {
    id: "jwt-secret-assignment",
    test: (content) => /\bJWT_SECRET\s*[:=]\s*["']?[^"'\s#][^\r\n#"'` ]*/i.test(content),
  },
  {
    id: "database-url-assignment",
    test: (content) => /\bDATABASE_URL\s*[:=]\s*["']?(?:postgres|postgresql):\/\/[^\s"'`#]+/i.test(content),
  },
  {
    id: "inline-postgres-url",
    test: (content) => /(?:postgres|postgresql):\/\/[^\s"'`#]+/i.test(content),
  },
  {
    id: "private-key-block",
    test: (content) => /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/.test(content),
  },
];

function isIgnoredFile(fileName) {
  return ignoredFilePatterns.some((pattern) => pattern.test(fileName));
}

function shouldScanFile(filePath) {
  const fileName = path.basename(filePath);
  if (isIgnoredFile(fileName)) {
    return false;
  }
  const extension = path.extname(filePath).toLowerCase();
  if (textFileExtensions.has(extension)) {
    return true;
  }
  return fileName === ".gitignore";
}

function isDocLikeFile(filePath) {
  return safeDocLikeExtensions.has(path.extname(filePath).toLowerCase()) || /\\docs\\|\/docs\//i.test(filePath);
}

function collectFiles(dirPath, output = []) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (ignoredDirNames.has(entry.name)) {
      continue;
    }

    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      collectFiles(entryPath, output);
      continue;
    }

    if (shouldScanFile(entryPath)) {
      output.push(entryPath);
    }
  }

  return output;
}

function inspectFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const issues = [];
  const docLike = isDocLikeFile(filePath);

  for (const pattern of riskyPatterns) {
    if (!pattern.test(content)) {
      continue;
    }

    if (docLike && pattern.id !== "private-key-block") {
      continue;
    }

    const lines = content.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (!pattern.test(line)) {
        continue;
      }
      issues.push({
        filePath,
        lineNumber: index + 1,
        patternId: pattern.id,
        linePreview: line.trim().slice(0, 180),
      });
    }
  }

  return issues;
}

const filesToScan = collectFiles(rootDir);
const findings = filesToScan.flatMap((filePath) => inspectFile(filePath));

const skippedLocalEnvFiles = fs
  .readdirSync(rootDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && isIgnoredFile(entry.name))
  .map((entry) => entry.name);

if (findings.length > 0) {
  console.error("Secret audit failed. Risky secret-like values were found:");
  for (const finding of findings) {
    console.error(
      `- ${path.relative(rootDir, finding.filePath)}:${finding.lineNumber} [${finding.patternId}] ${finding.linePreview}`,
    );
  }
  process.exit(1);
}

console.log("Secret audit passed.");
console.log(`Scanned ${filesToScan.length} files for risky secret patterns.`);
if (skippedLocalEnvFiles.length > 0) {
  console.log(`Skipped local-only env files: ${skippedLocalEnvFiles.join(", ")}`);
}
