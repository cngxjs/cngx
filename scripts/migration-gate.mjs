#!/usr/bin/env node
// Usage (the pr-title workflow's migration-gate job):
//   PR_TITLE=... PR_BODY=... BASE_REF=main node scripts/migration-gate.mjs
//
// A breaking PR (a `!` in the Conventional Commit title) must ship an
// `ng update` migration: a key in projects/core/schematics/migrations/
// migrations.json that the base branch does not have. A body line
// `Migration: not migratable` is the explicit way out. A change elsewhere
// under migrations/ (a fixture, a spec, a reworded entry) does not count;
// the migrations-well-formed guard makes sure a new key points at a real
// factory with a spec and a fixture pair.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const MIGRATIONS_PATH = 'projects/core/schematics/migrations/migrations.json';

function schematicKeys(json) {
  if (json === undefined) {
    return [];
  }
  const parsed = JSON.parse(json);
  return Object.keys(parsed?.schematics ?? {});
}

/** The `schematics` keys the head declares and the base does not; a missing file has none. */
export function newMigrationKeys(baseJson, headJson) {
  const base = new Set(schematicKeys(baseJson));
  return schematicKeys(headJson).filter((key) => !base.has(key));
}

/** `type(scope)!: subject` or `type!: subject`. */
export function isBreakingTitle(title) {
  return /^[a-z]+(\([^)]*\))?!:/.test(title);
}

/** The literal `Migration: not migratable` line, outside HTML comments. */
export function saysNotMigratable(body) {
  const visible = (body ?? '').replace(/<!--[\s\S]*?-->/g, '');
  return /^Migration:[ \t]*not migratable[ \t]*\r?$/m.test(visible);
}

export function checkMigrationGate({ title, body, base, head }) {
  if (!isBreakingTitle(title)) {
    return { ok: true, message: 'Not a breaking change; no migration needed.' };
  }
  const added = newMigrationKeys(base, head);
  if (added.length > 0) {
    return { ok: true, message: `New migration: ${added.join(', ')}.` };
  }
  if (saysNotMigratable(body)) {
    return { ok: true, message: 'Declared not migratable in the PR body.' };
  }
  return {
    ok: false,
    message: [
      `A breaking change needs a new key in ${MIGRATIONS_PATH} (an ng update migration),`,
      'or the line "Migration: not migratable" in the PR body.',
    ].join(' '),
  };
}

const git = (args) =>
  execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

/**
 * migrations.json on the base branch; `undefined` only when git lists no
 * such file there. A missing base ref or any other git failure throws, so
 * the gate fails closed instead of counting every head key as new.
 */
export function readBase(ref, exec = git) {
  const base = `origin/${ref}`;
  exec(['rev-parse', '--verify', '--quiet', `${base}^{commit}`]);
  if (exec(['ls-tree', '--name-only', base, '--', MIGRATIONS_PATH]).trim() === '') {
    return undefined;
  }
  return exec(['show', `${base}:${MIGRATIONS_PATH}`]);
}

function readHead() {
  const path = join(ROOT, MIGRATIONS_PATH);
  return existsSync(path) ? readFileSync(path, 'utf8') : undefined;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { PR_TITLE = '', PR_BODY = '', BASE_REF = 'main' } = process.env;
  let base;
  try {
    base = readBase(BASE_REF);
  } catch (error) {
    console.error(
      `migration-gate: cannot read ${MIGRATIONS_PATH} on origin/${BASE_REF}: ${error.message}`,
    );
    process.exit(1);
  }
  const verdict = checkMigrationGate({ title: PR_TITLE, body: PR_BODY, base, head: readHead() });
  console.log(`migration-gate: ${verdict.message}`);
  process.exit(verdict.ok ? 0 : 1);
}
