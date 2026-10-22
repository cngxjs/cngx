import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  changedInputs,
  INPUTS,
  matchesEntry,
  matchesInput,
  WORKFLOW_INPUTS,
  workflowInputs,
} from '../schematics-consumer-inputs.mjs';

/**
 * The schematics-consumer job skips its fixture when no input changed, so a
 * module the fixture scripts import but the input list misses would let a
 * breaking change through a green check.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ENTRY_SCRIPTS = ['scripts/consumer-fixture.mjs', 'scripts/pack-libs.mjs', 'scripts/publish.mjs', 'scripts/build-schematics.mjs'];
const STATIC_IMPORT = /^\s*(?:import|export)\s[^'"]*?from\s+['"](\.{1,2}\/[^'"]+)['"]/gm;

function relativeImports(file) {
  const source = readFileSync(join(ROOT, file), 'utf8');
  return [...source.matchAll(STATIC_IMPORT)].map(([, specifier]) =>
    relative(ROOT, resolve(dirname(join(ROOT, file)), specifier)),
  );
}

function importGraph(entries) {
  const seen = new Set();
  const queue = [...entries];
  while (queue.length > 0) {
    const file = queue.shift();
    if (seen.has(file)) {
      continue;
    }
    seen.add(file);
    queue.push(...relativeImports(file));
  }
  return [...seen];
}

const tracked = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);

describe('schematics-consumer inputs', () => {
  it.each(importGraph(ENTRY_SCRIPTS))('lists %s, which a fixture script imports', (file) => {
    expect(changedInputs([file])).toEqual([file]);
  });

  it.each(INPUTS.map((entry, index) => [entry.include, index]))('%s matches a tracked file', (_include, index) => {
    expect(tracked.some((file) => matchesInput(index, file))).toBe(true);
  });

  it('counts library source and leaves specs, docs and test helpers out', () => {
    expect(changedInputs(['projects/common/a11y/live-region.ts'])).toHaveLength(1);
    expect(
      changedInputs(['projects/common/a11y/live-region.spec.ts', 'projects/ui/README.md', 'projects/testing/index.ts', 'examples/x.ts']),
    ).toEqual([]);
  });

  it('is what the workflow reads, with no path filter of its own', () => {
    const workflow = readFileSync(join(ROOT, '.github', 'workflows', 'schematics-consumer.yml'), 'utf8');

    expect(workflow).toContain('node scripts/schematics-consumer-inputs.mjs --base');
    expect(workflow).not.toMatch(/^\s*paths:/m);
  });

  it.each(Object.entries(WORKFLOW_INPUTS).flatMap(([workflow, entries]) => entries.map((entry) => [workflow, entry])))(
    '%s adds %o, which matches a tracked file',
    (_workflow, entry) => {
      expect(tracked.some((file) => matchesEntry(entry, file))).toBe(true);
    },
  );

  it('runs each workflow on its own file only', () => {
    expect(changedInputs(['.github/workflows/consumer-compat.yml'])).toEqual([]);
    expect(changedInputs(['.github/workflows/consumer-compat.yml'], 'consumer-compat')).toHaveLength(1);
    expect(changedInputs(['.github/workflows/schematics-consumer.yml'], 'consumer-compat')).toEqual([]);
    expect(() => workflowInputs('nightly')).toThrow(/Unknown workflow "nightly"/);
  });
});

describe('consumer-compat inputs', () => {
  // The paths the workflow's own pattern covered before it read this list.
  const EARLIER_PATTERN = [
    'projects/core/package.json',
    'projects/forms/schematics/ng-add/index.ts',
    'scripts/consumer-fixture.mjs',
    'scripts/pack-libs.mjs',
    'scripts/peer-deps-guard.mjs',
    '.github/workflows/consumer-compat.yml',
  ];
  // A change to how the libs are built, stamped or installed, with no
  // schematic source or lib manifest in it.
  const BUILD_ONLY = [
    'scripts/build-schematics.mjs',
    'scripts/publish.mjs',
    'scripts/schematics-externals.mjs',
    'projects/common/a11y/live-region.ts',
    'package.json',
    'package-lock.json',
  ];

  it.each([...EARLIER_PATTERN, ...BUILD_ONLY])('runs the fixture rows on a change to %s', (file) => {
    expect(changedInputs([file], 'consumer-compat')).toEqual([file]);
  });

  it('is what the changes job reads, in place of a pattern of its own', () => {
    const workflow = readFileSync(join(ROOT, '.github', 'workflows', 'consumer-compat.yml'), 'utf8');

    expect(workflow).toContain('node scripts/schematics-consumer-inputs.mjs --base "$BASE_SHA" --workflow consumer-compat');
    expect(workflow).toContain('relevant: ${{ steps.filter.outputs.changed }}');
    expect(workflow).not.toMatch(/grep -E/);
  });
});
