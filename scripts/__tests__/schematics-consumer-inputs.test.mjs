import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { changedInputs, INPUTS, matchesInput } from '../schematics-consumer-inputs.mjs';

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
});
