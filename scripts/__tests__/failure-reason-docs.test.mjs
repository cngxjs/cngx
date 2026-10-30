// Every tracked markdown file that publishes the typed failure reasons of the
// cngx query core (`asset-missing`, `network`, `invalid-version`) must list the
// same set. A list that names `asset-missing` but not `invalid-version` is a
// stale copy, and so is one that still says `asset-missing` covers a malformed
// version: that case has had its own reason since `invalid-version` landed.
// The file set is collected from git, so a fifth list is checked the day it is
// committed; the four known lists are required, so a moved file fails instead
// of silently shrinking the set. CHANGELOG files record history and are skipped.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const PATHSPECS = [
  ':(glob)packages/*/README.md',
  ':(glob)packages/plugin/skills/**/SKILL.md',
  ':(glob)core-concepts/**/*.md',
];

const KNOWN_LISTS = [
  'core-concepts/agent-tooling.md',
  'packages/cli/README.md',
  'packages/mcp/README.md',
  'packages/plugin/skills/cngx-migrate/SKILL.md',
];

const STALE_CLAUSE = /\bcovers\b[^.]*\ba version that is not a release\b/i;

/** Table rows count one by one; every other block is one paragraph. */
function units(text) {
  return text
    .split(/\n\s*\n/)
    .flatMap((block) => (block.trimStart().startsWith('|') ? block.split('\n') : [block]))
    .map((unit) => unit.replace(/\s+/g, ' '));
}

/** The problems of one published text; empty when it lists the reasons correctly. */
function reasonListProblems(text) {
  if (!text.includes('asset-missing')) {
    return [];
  }
  const problems = [];
  if (!text.includes('invalid-version')) {
    problems.push('names asset-missing but not invalid-version');
  }
  for (const unit of units(text)) {
    if (unit.includes('asset-missing') && STALE_CLAUSE.test(unit)) {
      problems.push(`says asset-missing covers a malformed version: ${unit.trim().slice(0, 120)}`);
    }
  }
  return problems;
}

function publishedLists() {
  return execFileSync('git', ['ls-files', '--', ...PATHSPECS], { cwd: ROOT, encoding: 'utf8' })
    .split('\n')
    .filter((path) => path !== '' && !/(^|\/)CHANGELOG\.md$/.test(path))
    .filter((path) => readFileSync(join(ROOT, path), 'utf8').includes('asset-missing'));
}

describe('published failure-reason lists', () => {
  const lists = publishedLists();

  it('collects at least the four known lists', () => {
    expect(lists).toEqual(expect.arrayContaining(KNOWN_LISTS));
  });

  it.each(lists)('%s names invalid-version and no stale asset-missing clause', (path) => {
    expect(reasonListProblems(readFileSync(join(ROOT, path), 'utf8'))).toEqual([]);
  });
});

describe('reasonListProblems mutations', () => {
  const table = [
    '|Reason|Meaning|',
    '|-|-|',
    '|`network`|The download failed for a network reason.|',
    '|`asset-missing`|The release or its asset does not exist.|',
    '|`invalid-version`|A version that is not a release version, answered before any fetch.|',
  ].join('\n');

  it('accepts a complete list', () => {
    expect(reasonListProblems(table)).toEqual([]);
  });

  it('ignores a text that publishes no reasons', () => {
    expect(reasonListProblems('# Title\n\nNo reasons here.')).toEqual([]);
  });

  it('fails a list without invalid-version', () => {
    const mutated = table.split('\n').slice(0, 4).join('\n');
    expect(reasonListProblems(mutated)).toEqual(['names asset-missing but not invalid-version']);
  });

  it('fails the stale asset-missing clause in a table row', () => {
    const mutated = table.replace(
      'does not exist.|',
      'does not exist. Also covers a version that is not a release, and a query that threw.|',
    );
    expect(reasonListProblems(mutated)).toHaveLength(1);
    expect(reasonListProblems(mutated)[0]).toMatch(/covers a malformed version/);
  });

  it('fails the stale asset-missing clause in a prose paragraph', () => {
    const prose =
      'A fetch returns `network`, `asset-missing` or `invalid-version`.\n' +
      '`asset-missing` also covers a version that is not a release.';
    expect(reasonListProblems(prose)).toHaveLength(1);
  });
});
