#!/usr/bin/env node

/**
 * Validates all skills in the repository according to skill-set requirements:
 * 1. name in frontmatter matches folder name exactly (<= 64 chars, lowercase-hyphen)
 * 2. description is <= 1024 chars
 * 3. description contains both "use when" AND "do not use for" (two-way trigger)
 * 4. line count of SKILL.md is reasonable (target <= 300 lines)
 * 5. relative markdown links resolve to existing files
 * 6. no absolute paths or /slash-command invocation syntax
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const skillsDir = path.join(repoRoot, 'skills');

let errorsCount = 0;
let warningsCount = 0;

function logError(file, msg) {
  console.error(`❌ [ERROR] ${file}: ${msg}`);
  errorsCount++;
}

function logWarn(file, msg) {
  console.warn(`⚠️ [WARN] ${file}: ${msg}`);
  warningsCount++;
}

function checkMarkdownLinks(filePath, content) {
  const fileDir = path.dirname(filePath);
  const relPath = path.relative(repoRoot, filePath);
  const lines = content.split(/\r?\n/);

  // Link regex: [text](target)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // Check for non-portable slash-command references (e.g. /be-arch, /starci-be-..., /merge, /plugin)
    // Must be preceded by space, backtick, quote, or line start, and followed by space, backtick, quote, or line end.
    const slashMatches = line.match(/(?<=[\s`"'(]|^)(\/[a-z][a-z0-9\-_]+)(?=[\s`"')\.,:;]|$)/g);
    if (slashMatches) {
      slashMatches.forEach((cmd) => {
        // Exclude recognized system paths, URL routes, and repo paths
        if (!cmd.match(/^\/(usr|etc|var|tmp|dev|src|apps|node_modules|api|rest|graphql|v1|docs|users|dist|build|skills|references|profiles|scripts|submissions|exported|test|index|health|healthz|ready|live)/)) {
          logError(`${relPath}:${lineNum}`, `Non-portable slash command syntax '${cmd}'. Refer to skills by name without leading slash.`);
        }
      });
    }

    // Check absolute filesystem paths
    const absMatches = line.match(/([A-Za-z]:\\[^\s\)]+|\/(Users|home|root)\/[^\s\)]+)/g);
    if (absMatches) {
      absMatches.forEach((abs) => {
        logWarn(`${relPath}:${lineNum}`, `Hardcoded absolute path: ${abs}`);
      });
    }

    let match;
    while ((match = linkRegex.exec(line)) !== null) {
      const target = match[2];
      if (target.startsWith('http://') || target.startsWith('https://') || target.startsWith('mailto:') || target.startsWith('#')) {
        continue;
      }
      const cleanTarget = target.split('#')[0];
      if (!cleanTarget) continue;

      const resolved = path.resolve(fileDir, cleanTarget);
      if (!fs.existsSync(resolved)) {
        logError(`${relPath}:${lineNum}`, `Broken markdown link: [${match[1]}](${target}) -> Cannot find '${resolved}'`);
      }
    }
  });
}

function validateSkill(skillFolderName) {
  const skillFolder = path.join(skillsDir, skillFolderName);
  const skillFile = path.join(skillFolder, 'SKILL.md');

  if (!fs.existsSync(skillFile)) {
    logError(skillFolderName, `Missing SKILL.md in skills/${skillFolderName}`);
    return;
  }

  const content = fs.readFileSync(skillFile, 'utf8');
  const lines = content.split(/\r?\n/);

  if (lines.length > 300) {
    logWarn(`skills/${skillFolderName}/SKILL.md`, `Length is ${lines.length} lines (target is <= 300 lines; move depth to references/)`);
  }

  // Parse YAML frontmatter
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) {
    logError(`skills/${skillFolderName}/SKILL.md`, 'Missing YAML frontmatter (--- ... ---)');
    return;
  }

  const fm = fmMatch[1];
  const nameMatch = fm.match(/^name:\s*([^\r\n]+)/m);
  if (!nameMatch) {
    logError(`skills/${skillFolderName}/SKILL.md`, "Frontmatter missing 'name'");
  } else {
    const name = nameMatch[1].trim();
    if (name !== skillFolderName) {
      logError(`skills/${skillFolderName}/SKILL.md`, `Skill name '${name}' does not match folder name '${skillFolderName}'`);
    }
    if (name.length > 64) {
      logError(`skills/${skillFolderName}/SKILL.md`, `Skill name '${name}' exceeds 64 characters (${name.length})`);
    }
    if (!/^[a-z0-9-]+$/.test(name)) {
      logError(`skills/${skillFolderName}/SKILL.md`, `Skill name '${name}' must be lowercase-hyphen`);
    }
  }

  const descMatch = fm.match(/description:\s*(?:>|\|)?\s*\r?\n([\s\S]*?)(?=\r?\n[a-z_-]+:|\r?\n---|$)/i);
  if (!descMatch) {
    logError(`skills/${skillFolderName}/SKILL.md`, "Frontmatter missing 'description'");
  } else {
    const desc = descMatch[1].replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
    if (desc.length > 1024) {
      logError(`skills/${skillFolderName}/SKILL.md`, `Description length exceeds 1024 characters (${desc.length})`);
    }
    const hasUseWhen = /use\s+when/i.test(desc);
    const hasDoNotUse = /do\s+not\s+use\s+for/i.test(desc);

    if (!hasUseWhen) {
      logError(`skills/${skillFolderName}/SKILL.md`, "Description missing 'Use when:' trigger instruction");
    }
    if (!hasDoNotUse) {
      logError(`skills/${skillFolderName}/SKILL.md`, "Description missing 'DO NOT USE FOR:' boundary instruction");
    }
  }

  // Check links & references recursively inside the skill folder
  function checkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        checkDir(full);
      } else if (ent.isFile() && ent.name.endsWith('.md')) {
        const fileContent = fs.readFileSync(full, 'utf8');
        checkMarkdownLinks(full, fileContent);
      }
    }
  }

  checkDir(skillFolder);
}

console.log('🔍 Validating skills in be-skill-andy...');

if (!fs.existsSync(skillsDir)) {
  console.error(`Skills directory not found: ${skillsDir}`);
  process.exit(1);
}

const skillFolders = fs.readdirSync(skillsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

for (const folder of skillFolders) {
  validateSkill(folder);
}

console.log('\n--- Validation Summary ---');
console.log(`Skills checked: ${skillFolders.length}`);
console.log(`Errors: ${errorsCount}`);
console.log(`Warnings: ${warningsCount}`);

if (errorsCount > 0) {
  console.error('\n❌ Skill validation failed with errors.');
  process.exit(1);
} else {
  console.log('\n✅ All skills passed validation!');
  process.exit(0);
}
