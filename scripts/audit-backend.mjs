#!/usr/bin/env node

/**
 * Static audit scanner for backend codebases according to BE-* and BR-* rules.
 * Outputs a formatted findings table with Rule IDs, file:line, severity, and remedies.
 */

import fs from 'node:fs';
import path from 'node:path';

const targetPath = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : process.cwd();

const findings = [];

function addFinding({ ruleId, file, line, severity, evidence, remedy }) {
  findings.push({ ruleId, file, line, severity, evidence, remedy });
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const relPath = path.relative(targetPath, filePath);

  let inTransaction = false;
  let txStartLine = 0;

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();

    // BE-1: synchronize: true in ORM config
    if (/synchronize\s*:\s*true/i.test(line)) {
      addFinding({
        ruleId: 'BE-1',
        file: relPath,
        line: lineNum,
        severity: 'BLOCKER',
        evidence: trimmed,
        remedy: 'Disable synchronize: true; use versioned migrations as the sole schema authority.'
      });
    }

    // BE-3: External calls inside transaction
    if (/\b(?:transaction|\.transaction)\s*\(/i.test(line)) {
      inTransaction = true;
      txStartLine = lineNum;
    }
    if (inTransaction && lineNum !== txStartLine) {
      if (/(stripe|payment|paypal|axios|fetch|httpclient|natsClient|kafka|broker)\b/i.test(line) && !line.includes('//') && !line.includes('*')) {
        addFinding({
          ruleId: 'BE-3',
          file: relPath,
          line: lineNum,
          severity: 'BLOCKER',
          evidence: trimmed,
          remedy: 'Move external network call outside the database transaction block.'
        });
      }
      if (/^\s*\}\s*\)\s*;?\s*$/.test(line) || line.includes('commit()')) {
        inTransaction = false;
      }
    }

    // BE-13: in-process recurring timers
    if (/\bsetInterval\s*\(/i.test(line)) {
      addFinding({
        ruleId: 'BE-13',
        file: relPath,
        line: lineNum,
        severity: 'BLOCKER',
        evidence: trimmed,
        remedy: 'Replace setInterval with leader-elected scheduler or queue job running once per deployment.'
      });
    }

    // BE-20: throw new Error("prose")
    if (/throw\s+new\s+Error\s*\(/i.test(line)) {
      addFinding({
        ruleId: 'BE-20',
        file: relPath,
        line: lineNum,
        severity: 'WARN',
        evidence: trimmed,
        remedy: 'Throw a structured DomainException with a closed enum error code instead of raw Error.'
      });
    }

    // BE-25: ambient Date.now() or new Date()
    if (/(?:Date\.now\(\)|new\s+Date\(\))/i.test(line) && !filePath.includes('test') && !filePath.includes('spec')) {
      addFinding({
        ruleId: 'BE-25',
        file: relPath,
        line: lineNum,
        severity: 'WARN',
        evidence: trimmed,
        remedy: 'Inject ClockPort interface into constructor; avoid ambient non-deterministic time.'
      });
    }

    // BE-25: ambient Date.now() or new Date() in domain files
    if (/(?:Date\.now\(\)|new\s+Date\(\))/i.test(line) && !filePath.includes('test') && !filePath.includes('spec') && (filePath.includes('service') || filePath.includes('model') || filePath.includes('domain'))) {
      addFinding({
        ruleId: 'BE-25',
        file: relPath,
        line: lineNum,
        severity: 'WARN',
        evidence: trimmed,
        remedy: 'Inject ClockPort interface into constructor; avoid ambient non-deterministic time.'
      });
    }

    // BE-26: untyped any parameter
    if (/:\s*any\b/i.test(line) && !line.includes('//')) {
      addFinding({
        ruleId: 'BE-26',
        file: relPath,
        line: lineNum,
        severity: 'WARN',
        evidence: trimmed,
        remedy: 'Define explicit named interface or DTO; eliminate loose any types.'
      });
    }

    // BE-21: console.log in application code
    if (/console\.log\s*\(/i.test(line) && !filePath.includes('scripts') && !filePath.includes('test')) {
      addFinding({
        ruleId: 'BE-21',
        file: relPath,
        line: lineNum,
        severity: 'WARN',
        evidence: trimmed,
        remedy: 'Route logs through structured logger port with correlation ID.'
      });
    }
  });
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  const stat = fs.statSync(dir);
  if (stat.isFile()) {
    scanFile(dir);
    return;
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory() && ent.name !== 'node_modules' && ent.name !== '.git') {
      walk(full);
    } else if (ent.isFile() && (ent.name.endsWith('.ts') || ent.name.endsWith('.js'))) {
      scanFile(full);
    }
  }
}

console.log(`🔍 [be-audit] Running backend audit scan on ${targetPath}...\n`);
walk(targetPath);

if (findings.length === 0) {
  console.log('✅ Zero violations detected. Backend code conforms to all checked rules.');
  process.exit(0);
}

console.log(`Found ${findings.length} violation(s):\n`);
console.log('| Rule ID | File:Line | Severity | Violation Evidence | Proposed Remedy |');
console.log('|---|---|:---:|---|---|');
findings.forEach((f) => {
  const cleanEvidence = f.evidence.replace(/\|/g, '\\|').slice(0, 50);
  console.log(`| \`${f.ruleId}\` | \`${f.file}:${f.line}\` | **${f.severity}** | \`${cleanEvidence}\` | ${f.remedy} |`);
});

const blockers = findings.filter((f) => f.severity === 'BLOCKER').length;
const warns = findings.filter((f) => f.severity === 'WARN').length;

console.log(`\nSummary: ${blockers} BLOCKER(s), ${warns} WARN(s).`);
