import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { ALL_SCOPES } from '../changelog-scopes.mjs';

/**
 * The commit-scope allow-list exists twice, by necessity, and the two
 * copies fail at different stages when they drift:
 *
 * - `scripts/changelog-scopes.mjs` backs `commitlint.config.mjs`, which
 *   the husky `commit-msg` hook runs. A scope missing here is rejected
 *   locally at `git commit`.
 * - `.github/workflows/pr-title.yml` feeds the semantic-pull-request
 *   action's `scopes:` list. A scope missing there lets every real CI
 *   check pass and turns only "Validate PR title" red.
 *
 * Nothing connected the two, so a scope added to one and forgotten in the
 * other surfaced late and in a confusing place. This guard fails fast
 * instead, in both directions: neither list may carry a scope the other
 * does not.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const PR_TITLE_WORKFLOW = resolve(HERE, '..', '..', '.github', 'workflows', 'pr-title.yml');

/**
 * Reads the block scalar under `scopes: |`. Lines belong to the block
 * while they are blank or indented deeper than the `scopes:` key itself;
 * the first line at or below that indent ends it (`requireScope:`).
 */
function parseWorkflowScopes(yaml) {
  const lines = yaml.split('\n');
  const start = lines.findIndex((line) => /^\s*scopes:\s*\|\s*$/.test(line));
  if (start === -1) {
    throw new Error(`no "scopes: |" block found in ${PR_TITLE_WORKFLOW}`);
  }

  const keyIndent = lines[start].length - lines[start].trimStart().length;
  const scopes = [];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === '') {
      continue;
    }
    const indent = line.length - line.trimStart().length;
    if (indent <= keyIndent) {
      break;
    }
    scopes.push(line.trim());
  }
  return scopes;
}

describe('commit-scope allow-list parity', () => {
  const workflowScopes = parseWorkflowScopes(readFileSync(PR_TITLE_WORKFLOW, 'utf8'));

  it('parses a non-empty scope list out of pr-title.yml', () => {
    // Guards the parser itself: a YAML reshuffle that silently yields []
    // would make every assertion below vacuously pass.
    expect(workflowScopes.length).toBeGreaterThan(0);
  });

  it('lists no scope the commitlint allow-list is missing', () => {
    const missing = workflowScopes.filter((scope) => !ALL_SCOPES.includes(scope));
    expect(missing, `add to scripts/changelog-scopes.mjs: ${missing.join(', ')}`).toEqual([]);
  });

  it('carries every scope the commitlint allow-list defines', () => {
    const missing = ALL_SCOPES.filter((scope) => !workflowScopes.includes(scope));
    expect(missing, `add to .github/workflows/pr-title.yml scopes: ${missing.join(', ')}`).toEqual(
      [],
    );
  });

  it('declares each scope exactly once per list', () => {
    const duplicates = (list) => list.filter((scope, i) => list.indexOf(scope) !== i);
    expect(duplicates(ALL_SCOPES)).toEqual([]);
    expect(duplicates(workflowScopes)).toEqual([]);
  });
});
