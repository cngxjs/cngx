import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createFixtureTree, readFixture, runRule } from '../testing/run-schematic';
import { ngAdd } from './index';

// Specs run the source rule, so the version is core's source manifest.
const VERSION = (
  JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8')) as {
    version: string;
  }
).version;

const COLLECTION = JSON.parse(readFileSync(join(__dirname, '..', 'collection.json'), 'utf8')) as {
  schematics: Record<string, unknown>;
};
const SCHEMA = JSON.parse(readFileSync(join(__dirname, 'schema.json'), 'utf8')) as {
  properties: Record<string, unknown>;
};

function pinnedTree() {
  const manifest = JSON.parse(readFixture('standalone-app')['package.json']) as {
    dependencies: Record<string, string>;
  };
  manifest.dependencies['@cngx/utils'] = VERSION;
  return createFixtureTree('standalone-app', { 'package.json': JSON.stringify(manifest, null, 2) });
}

describe('ngAdd', () => {
  const isTTY = process.stdout.isTTY;

  beforeEach(() => {
    process.stdout.isTTY = false;
  });

  afterEach(() => {
    process.stdout.isTTY = isTTY;
  });

  it('prints the described plan, then the summary', async () => {
    const run = await runRule(ngAdd({}), createFixtureTree());

    expect(run.logs).toMatchSnapshot();
  });

  it('applies the plan to the tree', async () => {
    const run = await runRule(ngAdd({}), createFixtureTree());
    const manifest = JSON.parse(run.tree.readContent('package.json')) as {
      dependencies: Record<string, string>;
    };

    expect(manifest.dependencies['@cngx/utils']).toBe(VERSION);
  });

  it('schedules the install as its only task', async () => {
    const run = await runRule(ngAdd({ preset: 'minimal' }), createFixtureTree());

    expect(run.tasks).toEqual(['node-package']);
  });

  it('plans nothing, installs nothing and says so on an onboarded app', async () => {
    const tree = pinnedTree();
    const before = tree.readContent('package.json');

    const run = await runRule(ngAdd({}), tree);

    expect(run.tree.readContent('package.json')).toBe(before);
    expect(run.tasks).toEqual([]);
    expect(run.logs).toContain('  = Add @cngx/utils@' + VERSION + ' - already pinned');
    expect(run.logs).toContain('cngx is already set up; nothing changed.');
    expect(run.logs).toContain('1 step already in place.');
    expect(run.logs).not.toContain('Already in place:');
  });

  it('names the idempotent hits in the summary when quiet, since no plan list ran', async () => {
    const run = await runRule(ngAdd({ quiet: true }), pinnedTree());

    expect(run.logs).toEqual(expect.arrayContaining(['Already in place:', '  Add @cngx/utils@' + VERSION]));
  });

  it('prints only the summary when quiet', async () => {
    const run = await runRule(ngAdd({ quiet: true }), createFixtureTree());

    expect(run.logs[0]).toBe('cngx planned 1 change.');
    expect(run.logs.some((line) => line.startsWith('Planned'))).toBe(false);
  });

  it('asks nothing without a terminal, even with prompts on', async () => {
    const run = await runRule(ngAdd({ prompts: true }), createFixtureTree());

    expect(run.tasks).toEqual(['node-package']);
    expect(run.logs.some((line) => line.includes('?'))).toBe(false);
  });
});

describe('the ng-add collection', () => {
  it('is a single stage with no setup schematic', () => {
    expect(Object.keys(COLLECTION.schematics)).toEqual(['ng-add']);
  });

  it('declares no option the ng add command strips', () => {
    const stripped = [
      'interactive',
      'dryRun',
      'force',
      'defaults',
      'registry',
      'verbose',
      'skipConfirmation',
    ];

    expect(Object.keys(SCHEMA.properties).filter((name) => stripped.includes(name))).toEqual([]);
    expect(Object.keys(SCHEMA.properties)).toEqual(['project', 'preset', 'prompts', 'quiet']);
  });
});
