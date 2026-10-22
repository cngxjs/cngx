#!/usr/bin/env node
// Usage (the first step of the schematics-consumer job and of the
// consumer-compat `changes` job):
//   node scripts/schematics-consumer-inputs.mjs --base origin/main
//   node scripts/schematics-consumer-inputs.mjs --base origin/main --workflow consumer-compat
//
// Both workflows carry required checks, so they run on every pull request
// and decide inside the job whether the fixture has to run. This file is the
// one list of what the fixture reads: the schematics, the lib manifests, the
// release scripts, the workspace config and every library source the
// onboarded app compiles against (renaming an export the onboarding writes,
// such as `provideA11yPreferences`, must run the job). Each workflow adds its
// own file. scripts/__tests__/schematics-consumer-inputs.test.mjs keeps the
// list in sync with the scripts' import graph. Prints and writes
// `changed=true|false` to $GITHUB_OUTPUT when set.

import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/** `include` globs (`**` crosses folders, `*` does not); a match on `exclude` drops the file. */
export const INPUTS = [
  { include: 'projects/*/schematics/**' },
  { include: 'projects/*/package.json' },
  { include: 'projects/themes/**' },
  { include: 'scripts/build-schematics.mjs' },
  { include: 'scripts/schematics-externals.mjs' },
  { include: 'scripts/pack-libs.mjs' },
  { include: 'scripts/consumer-fixture.mjs' },
  { include: 'scripts/publish.mjs' },
  { include: 'scripts/cngx-libs.mjs' },
  { include: 'scripts/schematics-consumer-inputs.mjs' },
  { include: 'package.json' },
  { include: 'package-lock.json' },
  { include: 'angular.json' },
  { include: 'tsconfig*.json' },
  { include: 'projects/**', exclude: ['**/*.spec.ts', '**/*.md', 'projects/testing/**'] },
];

/** What each workflow reads beyond `INPUTS`: its own file, and for consumer-compat the peer guard it always ran on. */
export const WORKFLOW_INPUTS = {
  'schematics-consumer': [{ include: '.github/workflows/schematics-consumer.yml' }],
  'consumer-compat': [{ include: '.github/workflows/consumer-compat.yml' }, { include: 'scripts/peer-deps-guard.mjs' }],
};

const DEFAULT_WORKFLOW = 'schematics-consumer';

function globToRegExp(glob) {
  let source = '';
  for (let index = 0; index < glob.length; index++) {
    const char = glob[index];
    if (char === '*' && glob[index + 1] === '*') {
      source += '.*';
      index++;
    } else if (char === '*') {
      source += '[^/]*';
    } else {
      source += char.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp(`^${source}$`);
}

/** The input entries of `workflow`: the shared list plus its own. */
export function workflowInputs(workflow = DEFAULT_WORKFLOW) {
  const own = WORKFLOW_INPUTS[workflow];
  if (own === undefined) {
    throw new Error(`Unknown workflow "${workflow}". Available: ${Object.keys(WORKFLOW_INPUTS).join(', ')}`);
  }
  return [...INPUTS, ...own];
}

/** Whether one input entry covers a repo-relative path. */
export function matchesEntry({ include, exclude = [] }, path) {
  return globToRegExp(include).test(path) && !exclude.some((pattern) => globToRegExp(pattern).test(path));
}

/** Whether entry `index` of `INPUTS` covers a repo-relative path. */
export function matchesInput(index, path) {
  return matchesEntry(INPUTS[index], path);
}

/** The repo-relative paths among `files` the fixture of `workflow` reads. */
export function changedInputs(files, workflow = DEFAULT_WORKFLOW) {
  const entries = workflowInputs(workflow);
  return files.filter((file) => entries.some((entry) => matchesEntry(entry, file)));
}

const USAGE = `Usage: node scripts/schematics-consumer-inputs.mjs --base <ref> [--workflow <${Object.keys(WORKFLOW_INPUTS).join(' | ')}>]`;

function parseArgs(argv) {
  const valueOf = (flag) => {
    const at = argv.indexOf(flag);
    return at === -1 ? undefined : argv[at + 1];
  };
  const base = valueOf('--base');
  const workflow = valueOf('--workflow') ?? DEFAULT_WORKFLOW;
  if (base === undefined || !(workflow in WORKFLOW_INPUTS)) {
    console.error(USAGE);
    process.exit(1);
  }
  return { base, workflow };
}

function main() {
  const { base, workflow } = parseArgs(process.argv.slice(2));
  const files = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
  const changed = changedInputs(files, workflow);
  for (const file of changed) {
    console.log(`input changed: ${file}`);
  }
  const line = `changed=${changed.length > 0}`;
  console.log(line);
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${line}\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
