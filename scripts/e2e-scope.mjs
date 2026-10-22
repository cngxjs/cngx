#!/usr/bin/env node
// Usage (the e2e-scope job of ci.yml):
//   node scripts/e2e-scope.mjs --base <sha>   (pull request)
//   node scripts/e2e-scope.mjs --all          (push: everything)
//
// Decides which example e2e specs and console-sweep routes a pull request has
// to run. A change reaches an example demo (`<lib>/<category>/<demo>`, the
// folder of its stories and the first three segments of its routes) through
// the import graph: a lib entry point is affected when it changes or imports
// an affected entry, and a demo when its stories reach an affected entry. A
// story reaches an entry through its import lines and through every public
// symbol or selector it names, because the generator imports those itself
// (scripts/examples-gen). A spec runs when one of its routes lies in an
// affected demo; a spec whose routes cannot be read always runs.
//
// A change to what every route is built from (the examples app, the
// generator, the e2e helpers, themes, the toolchain) runs everything, and so
// does any path this file does not know; only paths that never reach the
// examples app (docs, specs, other packages and scripts) are left out.
//
// Writes to $GITHUB_OUTPUT when set:
//   mode=all|some|none
//   specs=<spec path filters for playwright, space-separated>  (mode=some)
//   grep=<title regex for the console sweep>                    (mode=some)
//   examples-shards, sweep-shards=<JSON list of shard numbers for the matrix>

import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import ts from 'typescript';

import { isSelectorSource, selectorsInSource } from './examples-gen/code-panel.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Changes that never reach the examples app or its e2e suites.
const IGNORED = [
  /\.md$/,
  /^\.internal\//,
  /^\.claude\//,
  /^core-concepts\//,
  /^docs\//,
  /^packages\//,
  /^e2e\//,
  /^projects\/testing\//,
  /^projects\/[^/]+\/schematics\//,
  /^projects\/.*\.spec\.ts$/,
  /^scripts\/(?!examples-gen\/|e2e-scope\.mjs$)/,
  /^\.github\/(?!workflows\/ci\.yml$)/,
  /^LICENSE$/,
  /^\.gitignore$/,
];

const LIB_SOURCE = /^projects\/([^/]+)\//;
const STORY = /^examples\/stories\/([^/]+)\/([^/]+)\/([^/]+)\//;
const SPEC = /^examples\/e2e\/.+\.e2e-spec\.ts$/;
// A baseline sits in `<spec>-snapshots/` next to the spec it belongs to.
const BASELINE = /^(examples\/e2e\/.+\.e2e-spec\.ts)-snapshots\//;
// `from '@cngx/...'` and `import('@cngx/...')`, also inside a story's string
// of import lines (`from \'@cngx/forms/select\'`).
const CNGX_IMPORT = /(?:\bfrom\s*|\bimport\s*\(\s*)\\?['"](@cngx\/[a-z0-9-]+(?:\/[a-z0-9-]+)*)\\?['"]/g;
// The route helpers of examples/e2e/_routes.ts, with one to three segments.
const ROUTE_CALL = /\broutes(?:In|Under)\(\s*'([a-z0-9-]+)'(?:\s*,\s*'([a-z0-9-]+)')?(?:\s*,\s*'([a-z0-9-]+)')?/g;
// A route literal, with or without its leading slash.
const ROUTE_LITERAL = /['"`]\/?([a-z0-9-]+)\/([a-z0-9-]+)\/([a-z0-9-]+)(?:\/[a-z0-9-]+)?\/?['"`]/g;

// Folders that are no part of what the examples app compiles.
const SKIPPED_DIRS = new Set(['node_modules', 'schematics']);

function walk(dir, keep) {
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return SKIPPED_DIRS.has(entry.name) ? [] : walk(path, keep);
    }
    return keep(path) ? [path] : [];
  });
}

/** The `@cngx/...` modules a story's import strings name. */
export function cngxNames(text) {
  return [...new Set([...text.matchAll(CNGX_IMPORT)].map(([, name]) => name))];
}

/** The `@cngx/...` modules TypeScript source imports; a comment or doc string is no import. */
export function sourceImports(text) {
  const { importedFiles } = ts.preProcessFile(text, true, true);
  return [...new Set(importedFiles.map(({ fileName }) => fileName).filter((name) => name.startsWith('@cngx/')))];
}

/** The route prefixes (`lib`, `lib/category` or `lib/category/demo`) a spec text visits. */
export function specRoutes(text, libs) {
  const calls = [...text.matchAll(ROUTE_CALL)].map((match) => match.slice(1).filter(Boolean).join('/'));
  const literals = [...text.matchAll(ROUTE_LITERAL)]
    .filter(([, lib]) => libs.includes(lib))
    .map(([, lib, category, demo]) => `${lib}/${category}/${demo}`);
  return [...new Set([...calls, ...literals])];
}

/** The deepest entry point among `entries` (`@cngx/<lib>[/<path>]`) that owns a module name. */
export function ownerEntry(entries, name) {
  return entries
    .filter((entry) => name === entry || name.startsWith(`${entry}/`))
    .sort((a, b) => b.length - a.length)[0];
}

/** The entry a repo-relative file under projects/ belongs to. */
function entryOfFile(entries, file) {
  const [, lib, rest] = /^projects\/([^/]+)\/(.*)$/.exec(file) ?? [];
  return lib === undefined ? undefined : ownerEntry(entries, `@cngx/${lib}/${dirname(rest)}`.replace(/\/\.$/, ''));
}

/**
 * The graph the scope reads, from the working tree: every entry point and
 * the entries it imports, the entries each demo's stories reach, the route
 * prefixes each spec visits, and the entries the examples app shell imports.
 */
export function readGraph(root = ROOT) {
  const rel = (path) => relative(root, path).split('\\').join('/');
  const entries = walk(join(root, 'projects'), (path) => path.endsWith('ng-package.json')).map(
    (path) => `@cngx/${rel(dirname(path)).slice('projects/'.length)}`,
  );
  const libs = [...new Set(entries.map((entry) => entry.split('/')[1]))];
  const imports = Object.fromEntries(entries.map((entry) => [entry, new Set()]));
  for (const file of walk(join(root, 'projects'), (path) => path.endsWith('.ts') && !path.endsWith('.spec.ts'))) {
    const owner = entryOfFile(entries, rel(file));
    for (const name of owner === undefined ? [] : sourceImports(readFileSync(file, 'utf8'))) {
      const target = ownerEntry(entries, name);
      if (target !== undefined && target !== owner) {
        imports[owner].add(target);
      }
    }
  }
  const owned = (names) => names.map((name) => ownerEntry(entries, name)).filter(Boolean);

  const symbols = new Map();
  const mark = (key, entry) => symbols.set(key, new Set([...(symbols.get(key) ?? []), entry]));
  for (const entry of entries) {
    const api = join(root, 'projects', entry.slice('@cngx/'.length), 'public-api.ts');
    const text = existsSync(api) ? readFileSync(api, 'utf8') : '';
    for (const [, list] of text.matchAll(/export\s+(?:type\s+)?\{([^}]+)\}/g)) {
      for (const name of list.split(',').map((raw) => raw.trim().replace(/^type\s+/, '').split(/\s+as\s+/).at(-1))) {
        if (name) {
          mark(name, entry);
        }
      }
    }
  }
  for (const file of walk(join(root, 'projects'), isSelectorSource)) {
    const owner = entryOfFile(entries, rel(file));
    for (const [, selectors] of owner === undefined ? [] : selectorsInSource(readFileSync(file, 'utf8'))) {
      for (const token of selectors.flatMap((selector) => selector.match(/cngx[\w-]*/gi) ?? [])) {
        mark(token, owner);
      }
    }
  }
  const named = (text) => (text.match(/[A-Za-z_$][\w$-]*/g) ?? []).flatMap((word) => [...(symbols.get(word) ?? [])]);

  const demos = {};
  for (const file of walk(join(root, 'examples', 'stories'), (path) => path.endsWith('.ts'))) {
    const [, lib, category, demo] = STORY.exec(rel(file)) ?? [];
    if (lib !== undefined) {
      const key = `${lib}/${category}/${demo}`;
      const text = readFileSync(file, 'utf8');
      demos[key] = new Set([...(demos[key] ?? []), ...owned(cngxNames(text)), ...named(text)]);
    }
  }
  const specs = {};
  for (const file of walk(join(root, 'examples', 'e2e'), (path) => path.endsWith('.e2e-spec.ts'))) {
    specs[rel(file)] = specRoutes(readFileSync(file, 'utf8'), libs);
  }
  const shellFiles = walk(join(root, 'examples', 'src'), (path) => path.endsWith('.ts') && !rel(path).includes('/app/features/'));
  const shell = new Set(owned(shellFiles.flatMap((file) => sourceImports(readFileSync(file, 'utf8')))));
  return { entries, imports, demos, specs, shell };
}

/** `entries` plus every entry that imports one of them, directly or through others. */
export function withDependents(graph, entries) {
  const affected = new Set(entries);
  let grew = true;
  while (grew) {
    grew = false;
    for (const [entry, targets] of Object.entries(graph.imports)) {
      if (!affected.has(entry) && [...targets].some((target) => affected.has(target))) {
        affected.add(entry);
        grew = true;
      }
    }
  }
  return affected;
}

const covers = (prefix, demo) => demo === prefix || demo.startsWith(`${prefix}/`);

/**
 * What a pull request with `files` changed has to run: `all`, `none`, or the
 * affected demos and the spec files that visit them.
 */
export function scopeFor(files, graph) {
  const changedEntries = new Set();
  const demos = new Set();
  const changedSpecs = new Set();
  for (const file of files) {
    if (IGNORED.some((pattern) => pattern.test(file))) {
      continue;
    }
    const story = STORY.exec(file);
    const spec = SPEC.test(file) ? file : BASELINE.exec(file)?.[1];
    const lib = LIB_SOURCE.exec(file)?.[1];
    const entry = lib === undefined || lib === 'themes' ? undefined : entryOfFile(graph.entries, file);
    if (story !== null) {
      demos.add(`${story[1]}/${story[2]}/${story[3]}`);
    } else if (spec !== undefined) {
      changedSpecs.add(spec);
    } else if (entry !== undefined) {
      changedEntries.add(entry);
    } else {
      return { mode: 'all', reason: file };
    }
  }
  const affected = withDependents(graph, changedEntries);
  for (const [demo, reached] of Object.entries(graph.demos)) {
    if ([...reached].some((entry) => affected.has(entry))) {
      demos.add(demo);
    }
  }
  // Every route renders the app shell, so the selected ones cover a change
  // the shell imports; with no route selected only a full run would.
  const shellHit = [...graph.shell].find((entry) => affected.has(entry));
  if (shellHit !== undefined && demos.size === 0) {
    return { mode: 'all', reason: `${shellHit} (the examples app shell imports it)` };
  }
  const specs = Object.entries(graph.specs)
    .filter(
      ([path, routes]) =>
        changedSpecs.has(path) ||
        (demos.size > 0 && routes.length === 0) ||
        routes.some((prefix) => [...demos].some((demo) => covers(prefix, demo))),
    )
    .map(([path]) => path)
    .sort();
  if (demos.size === 0 && specs.length === 0) {
    return { mode: 'none' };
  }
  return { mode: 'some', demos: [...demos].sort(), specs };
}

// Full runs: examples-e2e takes 16 to 21 minutes on one worker and the
// sweep 10 to 12 on four, so three and two shards keep each near 6.
export const FULL_SHARDS = { examples: 3, sweep: 2 };
// About how much one shard takes on before a second one pays for its own
// install and `ng serve`.
const SPECS_PER_SHARD = 40;
const DEMOS_PER_SHARD = 130;

/** The shard numbers of each suite's matrix for a scope; a small selection runs on fewer runners. */
export function shardsFor(scope) {
  const list = (count) => Array.from({ length: count }, (_, index) => index + 1);
  if (scope.mode !== 'some') {
    return { examples: list(FULL_SHARDS.examples), sweep: list(FULL_SHARDS.sweep) };
  }
  const count = (size, per, max) => Math.max(1, Math.min(max, Math.ceil(size / per)));
  return {
    examples: list(count(scope.specs.length, SPECS_PER_SHARD, FULL_SHARDS.examples)),
    sweep: list(count(scope.demos.length, DEMOS_PER_SHARD, FULL_SHARDS.sweep)),
  };
}

/**
 * The console-sweep title filter: the allowlist checks, and every route of
 * the demos. A sweep test is titled with its route (`ui/tabs/basic/...`),
 * after a space in the title path Playwright matches against.
 */
export function sweepGrep(demos) {
  const routes = demos.map((demo) => `(?:^| )${demo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/`);
  return ['console allowlist', ...routes].join('|');
}

/** The playwright path filters of a scope, relative to the repo root it runs from: the app smoke and its spec files. */
export function specFilters(specs) {
  return [...new Set(['examples/e2e/00-smoke.e2e-spec.ts', ...specs])];
}

function changedFiles(base) {
  return execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], { cwd: ROOT, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
}

function main() {
  const argv = process.argv.slice(2);
  const at = argv.indexOf('--base');
  const base = at === -1 ? undefined : argv[at + 1];
  if (base === undefined && !argv.includes('--all')) {
    console.error('Usage: node scripts/e2e-scope.mjs --base <ref> | --all');
    process.exit(1);
  }
  const scope = base === undefined ? { mode: 'all', reason: '--all' } : scopeFor(changedFiles(base), readGraph());
  const shards = shardsFor(scope);
  const lines = [
    `mode=${scope.mode}`,
    `examples-shards=${JSON.stringify(shards.examples)}`,
    `sweep-shards=${JSON.stringify(shards.sweep)}`,
  ];
  if (scope.mode === 'all') {
    console.log(`e2e scope: everything (${scope.reason})`);
  } else if (scope.mode === 'none') {
    console.log('e2e scope: nothing the examples app renders changed');
  } else {
    console.log(`e2e scope: ${scope.demos.length} demos, ${scope.specs.length} spec files`);
    scope.demos.forEach((demo) => console.log(`  demo ${demo}`));
    scope.specs.forEach((spec) => console.log(`  spec ${spec}`));
    lines.push(`specs=${specFilters(scope.specs).join(' ')}`, `grep=${sweepGrep(scope.demos)}`);
  }
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${lines.join('\n')}\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
