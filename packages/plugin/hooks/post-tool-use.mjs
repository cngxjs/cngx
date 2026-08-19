#!/usr/bin/env node
/**
 * PostToolUse guard hook: after an `Edit`/`Write` of a `@cngx/*`-importing
 * `.ts`/`.html` file, run the `@cngx/doctor` engine over the project and surface
 * any project-wiring finding as agent feedback.
 *
 * Cheap gate first - the hook exits `0` with no output when the tool is not
 * `Edit`/`Write`, the path is not `.ts`/`.html`, or the changed file imports no
 * `@cngx/*` symbol, before any scan. On a real hit it uses the doctor's
 * cached-snapshot path: a per-project snapshot (keyed by project root, in the OS
 * temp dir) is walked once on cache miss and thereafter updated for the changed
 * file only. Clean edits produce no output. Mirrors the invocation shape of
 * `session-start.mjs`.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runChecks } from '../bin/doctor/checks.mjs';
import { scan as defaultScan } from '../bin/doctor/scan.mjs';

const CANDIDATE_TOOLS = new Set(['Edit', 'Write']);
const SOURCE_EXTENSIONS = ['.ts', '.html'];

/** Cheap gate, no disk read: tool is Edit/Write and the path is a .ts/.html. */
export function isCandidateEdit(payload) {
  if (!CANDIDATE_TOOLS.has(payload?.tool_name)) {
    return false;
  }
  const filePath = payload?.tool_input?.file_path;
  return typeof filePath === 'string' && SOURCE_EXTENSIONS.some((ext) => filePath.endsWith(ext));
}

export function importsCngx(text) {
  return /from\s*['"]@cngx\/[^'"]+['"]/.test(text);
}

function cachePathFor(projectRoot, cacheDir) {
  const key = createHash('sha256').update(projectRoot).digest('hex').slice(0, 16);
  return join(cacheDir, `cngx-doctor-snapshot-${key}.json`);
}

/**
 * Runs the engine for a candidate edit and returns the findings, or `null` when
 * the changed file does not import `@cngx/*` or the project is clean. Injectable
 * `scan` / `cacheDir` for testing the warm-cache path.
 *
 * @returns {import('../bin/doctor/checks.mjs').Finding[] | null}
 */
export function evaluate(payload, options = {}) {
  const scan = options.scan ?? defaultScan;
  const cacheDir = options.cacheDir ?? tmpdir();
  const filePath = payload.tool_input.file_path;

  let changedText;
  try {
    changedText = readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
  if (!importsCngx(changedText)) {
    return null;
  }

  const projectRoot = typeof payload.cwd === 'string' && payload.cwd ? payload.cwd : process.cwd();
  const cacheFile = cachePathFor(projectRoot, cacheDir);

  let prior = null;
  if (existsSync(cacheFile)) {
    try {
      prior = JSON.parse(readFileSync(cacheFile, 'utf8'));
    } catch {
      prior = null;
    }
  }

  // Warm cache -> update the changed file only; cold cache -> one full walk.
  const snapshot = prior ? scan(projectRoot, { prior, changedFile: filePath }) : scan(projectRoot);

  try {
    mkdirSync(cacheDir, { recursive: true });
    writeFileSync(cacheFile, JSON.stringify(snapshot));
  } catch {
    /* cache is a best-effort optimisation - a write failure just re-walks next time */
  }

  const findings = runChecks(snapshot);
  return findings.length > 0 ? findings : null;
}

export function formatFeedback(findings) {
  const lines = [`cngx-doctor found ${findings.length} project-wiring issue(s) after this edit:`];
  for (const f of findings) {
    const where = f.file ? ` (${f.file})` : '';
    lines.push(`- [${f.severity}] ${f.id}${where}: ${f.message}`);
    lines.push(`  fix: ${f.fixHint}`);
  }
  return lines.join('\n');
}

function readStdin() {
  try {
    return JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return {};
  }
}

function main() {
  const payload = readStdin();
  if (!isCandidateEdit(payload)) {
    return;
  }
  const findings = evaluate(payload, {
    cacheDir: process.env.CNGX_DOCTOR_CACHE_DIR || tmpdir(),
  });
  if (!findings) {
    return;
  }
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: formatFeedback(findings),
      },
    }),
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
