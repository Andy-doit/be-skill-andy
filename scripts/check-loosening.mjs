#!/usr/bin/env node

/**
 * Scans files for banned quality-loosening markers (Rule BW-P5).
 * Flags inline suppressions: eslint-disable, @ts-ignore, @ts-nocheck, @ts-expect-error,
 * skipped tests (it.skip, test.skip, xdescribe), focused tests (it.only, fit), || true.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const targetDir = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : repoRoot;

const bannedPatterns = [
  { pattern: /eslint-disable/i, name: 'eslint-disable' },
  { pattern: /stylelint-disable/i, name: 'stylelint-disable' },
  { pattern: /@ts-ignore/i, name: '@ts-ignore' },
  { pattern: /@ts-nocheck/i, name: '@ts-nocheck' },
  { pattern: /@ts-expect-error/i, name: '@ts-expect-error' },
  { pattern: /\/\/\s*NOSONAR/i, name: 'NOSONAR comment' },
  { pattern: /\b(xit|xdescribe)\s*\(/, name: 'x-prefixed test' },
  { pattern: /\b(it|test|describe)\.skip\s*\(/, name: 'skipped test (.skip)' },
  { pattern: /\b(it|test|describe)\.only\s*\(/, name: 'focused test (.only)' },
  { pattern: /\b(fit|fdescribe)\s*\(/, name: 'focused test (f-prefixed)' },
  { pattern: /\|\|\s*true\b/, name: 'short-circuit || true' },
  { pattern: /--no-verify\b/, name: '--no-verify flag' }
];

let violations = 0;

function scanFile(filePath) {
  const relPath = path.relative(repoRoot, filePath);
  // Skip policy definition files, scripts that check loosening, git internal files, and work logs
  if (
    relPath.includes('node_modules') ||
    relPath.includes('.git') ||
    relPath.endsWith('check-loosening.mjs') ||
    relPath.endsWith('work_log.md') ||
    relPath.endsWith('CHANGELOG.md') ||
    relPath.endsWith('phase0-inventory.md') ||
    relPath.endsWith('phase1-coverage.md') ||
    relPath.endsWith('phase2-plan.md') ||
    relPath.endsWith('conventions.md')
  ) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  lines.forEach((line, idx) => {
    bannedPatterns.forEach(({ pattern, name }) => {
      if (pattern.test(line)) {
        // Allow mentions in documentation if prefixed with backticks or in a table explaining banned rules
        if (filePath.endsWith('.md') && (line.includes('`') || line.includes('|'))) {
          return;
        }
        console.error(`❌ [LOOSENING] ${relPath}:${idx + 1} -> Banned marker '${name}' found: ${line.trim()}`);
        violations++;
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

console.log(`🔍 Scanning for quality loosening markers in ${targetDir}...`);
walk(targetDir);

if (violations > 0) {
  console.error(`\n❌ Found ${violations} banned loosening marker(s). Change the code, not the gate!`);
  process.exit(1);
} else {
  console.log('✅ No loosening markers found. All quality gates intact.');
  process.exit(0);
}
