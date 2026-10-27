// Proves the wiring of the cli core copy guard, not just compareTrees: CI must
// check the committed copy before anything could regenerate it. Expected values
// come from the plan's copy-guard contract: build:cli never runs cli:sync (also
// not through a nested `npm run`), and in the ci.yml `mcp` job the
// cli:copy-check step precedes build:cli with no sync step before it.
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (...path) => readFileSync(join(ROOT, ...path), 'utf8');

const SYNC = /\bcli:sync\b|sync-cli-core\.mjs/;

/** The script body with every `npm run <name>` replaced by that script's expanded body. */
function expandScript(scripts, name, seen = new Set()) {
  if (seen.has(name) || scripts[name] === undefined) {
    return '';
  }
  seen.add(name);
  return scripts[name].replace(/npm run ([\w:-]+)/g, (call, inner) =>
    scripts[inner] === undefined ? call : `${call} (${expandScript(scripts, inner, seen)})`,
  );
}

const buildSyncs = (scripts) => SYNC.test(expandScript(scripts, 'build:cli'));

/** The `run:` commands of one workflow job, in step order. */
function jobRuns(workflow, job) {
  const start = workflow.indexOf(`\n  ${job}:\n`);
  if (start === -1) {
    return null;
  }
  const rest = workflow.slice(start + 1);
  const next = rest.slice(1).search(/\n {2}[\w-]+:\n/);
  const block = next === -1 ? rest : rest.slice(0, next + 1);
  return [...block.matchAll(/^\s+run: (.+)$/gm)].map((match) => match[1].trim());
}

/** Wiring defects of the copy check in a job's run list; empty when correct. */
function copyCheckWiring(runs, scripts) {
  const expanded = runs.map((run) => run.replace(/npm run ([\w:-]+)/g, (call, name) => `${call} (${expandScript(scripts, name)})`));
  const check = runs.findIndex((run) => /npm run cli:copy-check\b/.test(run));
  const build = runs.findIndex((run) => /npm run build:cli\b/.test(run));
  const errors = [];
  if (check === -1) {
    errors.push('no cli:copy-check step');
  }
  if (build === -1) {
    errors.push('no build:cli step');
  }
  if (check !== -1 && build !== -1 && check > build) {
    errors.push('cli:copy-check runs after build:cli');
  }
  const syncBefore = expanded.slice(0, check === -1 ? expanded.length : check).some((run) => SYNC.test(run));
  if (syncBefore) {
    errors.push('a step before cli:copy-check runs cli:sync');
  }
  return errors;
}

const scripts = JSON.parse(read('package.json')).scripts;
const workflow = read('.github', 'workflows', 'ci.yml');

describe('cli core copy guard wiring', () => {
  it('build:cli does not sync the copy, directly or through a nested npm run', () => {
    expect(scripts['build:cli']).toBeDefined();
    expect(buildSyncs(scripts)).toBe(false);
  });

  it('the mcp job checks the committed copy before it builds the cli', () => {
    const runs = jobRuns(workflow, 'mcp');

    expect(runs).not.toBeNull();
    expect(copyCheckWiring(runs, scripts)).toEqual([]);
  });

  describe('mutations', () => {
    it('fails a build:cli that syncs', () => {
      expect(buildSyncs({ ...scripts, 'build:cli': `npm run cli:sync && ${scripts['build:cli']}` })).toBe(true);
    });

    it('fails a build:cli that syncs through a nested script', () => {
      const mutated = { ...scripts, 'build:mcp': `node scripts/sync-cli-core.mjs && ${scripts['build:mcp']}` };

      expect(buildSyncs(mutated)).toBe(true);
    });

    it('fails a job that checks the copy after the build', () => {
      const runs = ['npm ci', 'npm run build:cli', 'npm run cli:copy-check', 'npm run test:cli'];

      expect(copyCheckWiring(runs, scripts)).toContain('cli:copy-check runs after build:cli');
    });

    it('fails a job that syncs before the check', () => {
      const runs = ['npm ci', 'npm run cli:sync', 'npm run cli:copy-check', 'npm run build:cli'];

      expect(copyCheckWiring(runs, scripts)).toContain('a step before cli:copy-check runs cli:sync');
    });

    it('fails a job without the check', () => {
      expect(copyCheckWiring(['npm ci', 'npm run build:cli'], scripts)).toContain('no cli:copy-check step');
    });
  });
});
