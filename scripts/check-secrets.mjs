#!/usr/bin/env node

/**
 * Scans files for committed secrets, credentials, API keys, private keys,
 * or hardcoded passwords (Rule BW-P6, BE-19).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const targetDir = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : repoRoot;

const secretPatterns = [
  { pattern: /-----BEGIN (RSA|EC|OPENSSH|DSA|PGP|PRIVATE) KEY-----/, name: 'Private Key block' },
  { pattern: /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,255}\b/, name: 'GitHub Personal Access Token' },
  { pattern: /\bxox[baprs]-[0-9]{10,13}-[0-9]{10,13}[a-zA-Z0-9-]*\b/, name: 'Slack Token' },
  { pattern: /\bAIza[0-9A-Za-z\\-_]{35}\b/, name: 'Google API Key' },
  { pattern: /\bAKIA[0-9A-Z]{16}\b/, name: 'AWS Access Key ID' },
  { pattern: /(?:postgres|mysql|redis|mongodb):\/\/[^:\s]+:[^@\s]+@[^\s/]+/, name: 'URI with embedded plaintext credentials' }
];

let leaksFound = 0;

function scanFile(filePath) {
  const relPath = path.relative(repoRoot, filePath);
  // Skip git internal, logs, and audit files that explicitly cite findings
  if (
    relPath.includes('node_modules') ||
    relPath.includes('.git') ||
    relPath.endsWith('check-secrets.mjs') ||
    relPath.endsWith('phase0-inventory.md') ||
    relPath.endsWith('phase1-coverage.md') ||
    relPath.endsWith('phase2-plan.md') ||
    relPath.endsWith('work_log.md') ||
    relPath.endsWith('.env.example')
  ) {
    return;
  }

  // Reject real .env files committed to git
  const baseName = path.basename(filePath);
  if (baseName === '.env' || baseName.startsWith('.env.') && !baseName.endsWith('.example')) {
    console.error(`❌ [SECRET] Real environment file committed: ${relPath}`);
    leaksFound++;
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  lines.forEach((line, idx) => {
    secretPatterns.forEach(({ pattern, name }) => {
      if (pattern.test(line)) {
        console.error(`❌ [SECRET] ${relPath}:${idx + 1} -> Potential secret '${name}' found: ${line.trim().slice(0, 80)}...`);
        leaksFound++;
      }
    });
  });
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        walk(fullPath);
      }
    } else if (entry.isFile()) {
      scanFile(fullPath);
    }
  }
}

console.log(`🔍 Scanning for potential secrets and credentials in ${targetDir}...`);
walk(targetDir);

if (leaksFound > 0) {
  console.error(`\n❌ Found ${leaksFound} potential secret leak(s). Credentials must be removed!`);
  process.exit(1);
} else {
  console.log('✅ No committed secrets or real .env files found.');
  process.exit(0);
}
