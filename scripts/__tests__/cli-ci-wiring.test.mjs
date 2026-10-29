// Proves the wiring of the cli core copy guard, not just compareTrees: CI must
// check the committed copy before anything could regenerate it. Expected values
// come from the plan's copy-guard contract: build:cli never runs cli:sync (also
// not through a nested `npm run`), and in the ci.yml `mcp` job the
// cli:copy-check step precedes build:cli with no sync step before it. The same
// job must also run both spec suites, type-check the specs, and run the built
// CLI once on Node 20, the engines floor of @cngx/cli. ci.yml is parsed, so a
// required step only counts with its exact `run`, no `continue-on-error` and no
// `if:` - an `|| true` or a skipped step cannot pass as wired. The job needs the
// build job and downloads its artifact before build:mcp, and the scripts those
// steps call must run both cli vitest configs and type-check both spec projects.
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import yaml from 'js-yaml';
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

/** The parsed `steps` of one workflow job, or null. */
function jobSteps(workflow, job) {
  return yaml.load(workflow)?.jobs?.[job]?.steps ?? null;
}

/** The `run:` commands of one workflow job, in step order. */
function jobRuns(workflow, job) {
  const steps = jobSteps(workflow, job);
  return steps === null ? null : steps.filter((step) => typeof step.run === 'string').map((step) => step.run.trim());
}

const NODE_FLOOR_RUN = 'node packages/cli/dist/index.js --version && node packages/cli/dist/index.js api CngxSelect';
const REQUIRED_RUNS = [
  'npm run build:mcp',
  'npm run test:mcp',
  'npm run cli:copy-check',
  'npm run build:cli',
  'npm run test:cli',
  'npm run typecheck:tooling',
  NODE_FLOOR_RUN,
];

const isSetupNode = (step) => typeof step.uses === 'string' && step.uses.startsWith('actions/setup-node');

/** Defects of the mcp job's required steps in its parsed workflow; empty when all are wired. */
function requiredSteps(workflow) {
  const job = yaml.load(workflow)?.jobs?.mcp;
  if (!job) {
    return ['no mcp job'];
  }
  const errors = [];
  if (job.if !== undefined || job['continue-on-error'] !== undefined) {
    errors.push('the mcp job is conditional or may fail');
  }
  if (![job.needs].flat().includes('build')) {
    errors.push('the mcp job does not need build');
  }
  const steps = job.steps ?? [];
  const download = steps.findIndex(
    (step) => typeof step.uses === 'string' && step.uses.startsWith('actions/download-artifact') && step.with?.name === 'build-output',
  );
  const buildMcp = steps.findIndex((step) => step.run?.trim() === 'npm run build:mcp');
  if (download === -1 || (buildMcp !== -1 && download > buildMcp)) {
    errors.push('no build-output download before build:mcp');
  }
  for (const required of REQUIRED_RUNS) {
    const step = steps.find((candidate) => typeof candidate.run === 'string' && candidate.run.trim() === required);
    if (!step) {
      errors.push(`no "${required}" step`);
      continue;
    }
    if (step['continue-on-error'] !== undefined) {
      errors.push(`"${required}" has continue-on-error`);
    }
    if (step.if !== undefined) {
      errors.push(`"${required}" has an if:`);
    }
  }
  // The floor run follows a Node 20 setup-node with no other setup-node in between.
  const floorIndex = steps.findIndex((step) => step.run?.trim() === NODE_FLOOR_RUN);
  const lastSetup = steps.slice(0, Math.max(floorIndex, 0)).findLast(isSetupNode);
  if (floorIndex !== -1 && String(lastSetup?.with?.['node-version']) !== '20') {
    errors.push('no run of the built cli on Node 20');
  }
  if (lastSetup !== undefined && (lastSetup.if !== undefined || lastSetup['continue-on-error'] !== undefined)) {
    errors.push('the Node 20 setup step is conditional or may fail');
  }
  return errors;
}

const TEST_CLI_CONFIGS = ['--config packages/cli/vitest.config.mjs', '--config packages/cli/vitest.core.config.mjs'];
const TYPECHECK_PROJECTS = ['tsc -p packages/mcp/tsconfig.spec.json', 'tsc -p packages/cli/tsconfig.spec.json'];

/** Defects of the script bodies the mcp job calls; empty when both cover what their names promise. */
function scriptBodies(scripts) {
  const errors = [];
  for (const config of TEST_CLI_CONFIGS) {
    if (!(scripts['test:cli'] ?? '').includes(config)) {
      errors.push(`test:cli does not run ${config}`);
    }
  }
  for (const project of TYPECHECK_PROJECTS) {
    if (!(scripts['typecheck:tooling'] ?? '').includes(project)) {
      errors.push(`typecheck:tooling does not run ${project}`);
    }
  }
  return errors;
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

  it('build:cli and the cli prepublishOnly run the copy check first', () => {
    const cliScripts = JSON.parse(read('packages', 'cli', 'package.json')).scripts;

    expect(scripts['build:cli']).toMatch(/^npm run cli:copy-check && /);
    expect(cliScripts.prepublishOnly).toMatch(/^node \.\.\/\.\.\/scripts\/cli-core-copy-check\.mjs && /);
  });

  it('the mcp job checks the committed copy before it builds the cli', () => {
    const runs = jobRuns(workflow, 'mcp');

    expect(runs).not.toBeNull();
    expect(copyCheckWiring(runs, scripts)).toEqual([]);
  });

  it('the mcp job runs both spec suites, the spec type-check and the cli on Node 20', () => {
    expect(requiredSteps(workflow)).toEqual([]);
  });

  it('test:cli runs both vitest configs and typecheck:tooling covers both spec projects', () => {
    expect(scriptBodies(scripts)).toEqual([]);
  });

  describe('mutations', () => {
    it('fails a test:cli without the core config', () => {
      const mutated = { ...scripts, 'test:cli': 'vitest run --config packages/cli/vitest.config.mjs' };

      expect(scriptBodies(mutated)).toEqual(['test:cli does not run --config packages/cli/vitest.core.config.mjs']);
    });

    it('fails a typecheck:tooling without the cli spec project', () => {
      const mutated = { ...scripts, 'typecheck:tooling': 'tsc -p packages/mcp/tsconfig.spec.json' };

      expect(scriptBodies(mutated)).toEqual(['typecheck:tooling does not run tsc -p packages/cli/tsconfig.spec.json']);
    });

    it('fails an mcp job that does not need build', () => {
      const mutated = workflow.replace(/(\n  mcp:\n)    needs: build\n/, '$1');

      expect(mutated).not.toBe(workflow);
      expect(requiredSteps(mutated)).toEqual(['the mcp job does not need build']);
    });

    it('fails an mcp job without the artifact download', () => {
      const mutated = workflow.replace(/( +)- name: Download build output\n\1  uses: actions\/download-artifact@v4\n\1  with:\n\1    name: build-output\n(?=\1- name: Build mcp)/, '');

      expect(mutated).not.toBe(workflow);
      expect(requiredSteps(mutated)).toEqual(['no build-output download before build:mcp']);
    });

    it('fails a conditional Node 20 setup step', () => {
      const mutated = workflow.replace(/( +)- uses: actions\/setup-node@v4\n\1  with:\n\1    node-version: 20\n/, '$1- uses: actions/setup-node@v4\n$1  if: false\n$1  with:\n$1    node-version: 20\n');

      expect(mutated).not.toBe(workflow);
      expect(requiredSteps(mutated)).toEqual(['the Node 20 setup step is conditional or may fail']);
    });

    it('fails a Node 20 setup step with continue-on-error', () => {
      const mutated = workflow.replace(/( +)- uses: actions\/setup-node@v4\n\1  with:\n\1    node-version: 20\n/, '$1- uses: actions/setup-node@v4\n$1  continue-on-error: true\n$1  with:\n$1    node-version: 20\n');

      expect(mutated).not.toBe(workflow);
      expect(requiredSteps(mutated)).toEqual(['the Node 20 setup step is conditional or may fail']);
    });

    it('fails a job without the Test cli step', () => {
      const mutated = workflow.replace(/\n\s+- name: Test cli\n\s+run: npm run test:cli\n/, '\n');

      expect(mutated).not.toBe(workflow);
      expect(requiredSteps(mutated)).toEqual(['no "npm run test:cli" step']);
    });

    it('fails a job without the spec type-check', () => {
      const mutated = workflow.replace('run: npm run typecheck:tooling', 'run: echo skipped');

      expect(requiredSteps(mutated)).toEqual(['no "npm run typecheck:tooling" step']);
    });

    it('fails a job without the Node 20 run', () => {
      const mutated = workflow.replace(/node-version: 20\b/, 'node-version: 22');

      expect(mutated).not.toBe(workflow);
      expect(requiredSteps(mutated)).toEqual(['no run of the built cli on Node 20']);
    });

    it('fails a Test cli step whose failure is swallowed by || true', () => {
      const mutated = workflow.replace('run: npm run test:cli', 'run: npm run test:cli || true');

      expect(requiredSteps(mutated)).toEqual(['no "npm run test:cli" step']);
    });

    it('fails a Test cli step with continue-on-error', () => {
      const mutated = workflow.replace(/( +)run: npm run test:cli\n/, '$1run: npm run test:cli\n$1continue-on-error: true\n');

      expect(mutated).not.toBe(workflow);
      expect(requiredSteps(mutated)).toEqual(['"npm run test:cli" has continue-on-error']);
    });

    it('fails a Test cli step with if: false', () => {
      const mutated = workflow.replace(/( +)run: npm run test:cli\n/, '$1run: npm run test:cli\n$1if: false\n');

      expect(mutated).not.toBe(workflow);
      expect(requiredSteps(mutated)).toEqual(['"npm run test:cli" has an if:']);
    });

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
