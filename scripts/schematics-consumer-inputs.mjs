#!/usr/bin/env node
// Usage (the schematics-consumer workflow's first step):
//   node scripts/schematics-consumer-inputs.mjs --base origin/main
//
// The schematics-consumer job is a required check, so it runs on every pull
// request and decides inside the job whether its fixture has to run. This
// file is the one list of what the fixture reads: the schematics, the lib
// manifests, the release scripts, the workspace config and every library
// source the onboarded app compiles against (renaming an export the
// onboarding writes, such as `provideA11yPreferences`, must run the job).
// scripts/__tests__/schematics-consumer-inputs.test.mjs keeps it in sync with
// the scripts' import graph. Prints and writes `changed=true|false` to
// $GITHUB_OUTPUT when set.

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
  { include: '.github/workflows/schematics-consumer.yml' },
  { include: 'package.json' },
  { include: 'package-lock.json' },
  { include: 'angular.json' },
  { include: 'tsconfig*.json' },
  { include: 'projects/**', exclude: ['**/*.spec.ts', '**/*.md', 'projects/testing/**'] },
];

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

const COMPILED = INPUTS.map(({ include, exclude = [] }) => ({
  include: globToRegExp(include),
  exclude: exclude.map(globToRegExp),
}));

/** Whether one input entry covers a repo-relative path. */
export function matchesInput(index, path) {
  const { include, exclude } = COMPILED[index];
  return include.test(path) && !exclude.some((pattern) => pattern.test(path));
}

/** The repo-relative paths among `files` the fixture reads. */
export function changedInputs(files) {
  return files.filter((file) => INPUTS.some((_entry, index) => matchesInput(index, file)));
}

function parseBase(argv) {
  const at = argv.indexOf('--base');
  const base = at === -1 ? undefined : argv[at + 1];
  if (base === undefined) {
    console.error('Usage: node scripts/schematics-consumer-inputs.mjs --base <ref>');
    process.exit(1);
  }
  return base;
}

function main() {
  const base = parseBase(process.argv.slice(2));
  const files = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
  const changed = changedInputs(files);
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
