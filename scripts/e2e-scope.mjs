#!/usr/bin/env node
// Usage (the e2e-scope job of ci.yml):
//   node scripts/e2e-scope.mjs --base <sha>   (pull request)
//   node scripts/e2e-scope.mjs --all          (push: everything)
//
// Decides which example e2e specs and console-sweep routes a pull request has
// to run. Every story file is one example route: its path under
// examples/stories without `.story.ts`, at any depth. A change reaches a
// route through the import graph: a lib entry point is affected when it
// changes or imports an affected entry, and a route when its story reaches
// an affected entry. A story reaches an entry through its import lines,
// through every public symbol or selector it names (the generator imports
// those itself, scripts/examples-gen), and through every file it imports by
// a relative path (fixtures, helper components), followed transitively. A
// spec runs when one of its routes (route helper calls and route literals,
// any depth) covers an affected route; a spec whose routes cannot be read
// always runs.
//
// A change to what every route is built from (the examples app, the
// generator, the e2e helpers, the global theming CSS, the toolchain) runs
// everything, and so
// does any path this file does not know; only paths that never reach the
// examples app (docs, specs, other packages and scripts) are left out.
//
// Writes to $GITHUB_OUTPUT when set:
//   mode=all|some|none
//   specs=<spec path filters for playwright, space-separated>  (mode=some)
//   grep=<title regex for the console sweep, empty for all>    (mode=some)
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
// The global stylesheets: projects/themes/cngx.css imports every lib's
// theming folder, and examples/src/styles.scss loads it on every route.
const GLOBAL_THEMING = /^projects\/(?:themes\/|[^/]+\/theming\/)/;
const STORY = /^examples\/stories\/(.+)\.story\.ts$/;
// Files a story or the app shell may import by a relative path.
const EXAMPLE_SOURCE = /^examples\/(?:stories|fixtures)\//;
const SPEC = /^examples\/e2e\/.+\.e2e-spec\.ts$/;
// A baseline sits in `<spec>-snapshots/` next to the spec it belongs to.
const BASELINE = /^(examples\/e2e\/.+\.e2e-spec\.ts)-snapshots\//;
// `from '...'` and `import('...')`, also inside a story's string of import
// lines (`from \'@cngx/forms/select\'`, `from \'../../../../fixtures\'`).
const IMPORT_STRING = /(?:\bfrom\s*|\bimport\s*\(\s*)\\?['"]([^'"\\]+)\\?['"]/g;
const ROUTE_CALL = /\broutes(?:In|Under)\(([^)]*)\)/g;
// A route literal of at least two segments, with or without its leading slash.
const ROUTE_LITERAL = /['"`]\/?([a-z0-9-]+(?:\/[a-z0-9-]+)+)\/?['"`]/g;
// Past this many characters the sweep filter would outgrow a command line
// argument; the sweep then runs every route.
const MAX_GREP = 30_000;

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

/** Every module a text imports, in code and in a story's import strings alike. */
export function importStrings(text) {
  return [...new Set([...text.matchAll(IMPORT_STRING)].map(([, name]) => name))];
}

/** The modules TypeScript source imports; a comment or doc string is no import. */
export function sourceImports(text) {
  return [...new Set(ts.preProcessFile(text, true, true).importedFiles.map(({ fileName }) => fileName))];
}

/** The prefixes of a spec's route helper calls; `undefined` when one takes anything but string literals. */
export function routeCalls(text) {
  const prefixes = [];
  for (const [, args] of text.matchAll(ROUTE_CALL)) {
    const segments = [...args.matchAll(/'([a-z0-9-]+)'/g)].map(([, segment]) => segment);
    if (segments.length === 0 || args.replace(/'[a-z0-9-]+'|[\s,]/g, '') !== '') {
      return undefined;
    }
    prefixes.push(segments.join('/'));
  }
  return prefixes;
}

/**
 * The route prefixes a spec text visits: the segments of every route helper
 * call and every route literal under a lib. `undefined` when a call takes
 * anything but string literals, so the spec's routes cannot be read.
 */
export function specRoutes(text, libs) {
  const calls = routeCalls(text);
  if (calls === undefined) {
    return undefined;
  }
  const routes = [...calls];
  for (const [, route] of text.matchAll(ROUTE_LITERAL)) {
    if (libs.includes(route.split('/')[0])) {
      routes.push(route);
    }
  }
  return [...new Set(routes)];
}

/** Whether route prefix `prefix` covers `route`. */
export const covers = (prefix, route) => route === prefix || route.startsWith(`${prefix}/`);

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

// The file a relative module name points at from `from`, or undefined.
function resolveRelative(from, name) {
  const base = resolve(dirname(from), name);
  return [base, `${base}.ts`, join(base, 'index.ts')].find((candidate) => candidate.endsWith('.ts') && existsSync(candidate));
}

/**
 * The files a relative module name in a story stands for: the path as
 * written, and the one the generator rewrites it to (scripts/examples-gen,
 * `rewritePaths`): `../_fixtures/X` at any depth is examples/src/app/_fixtures/X,
 * any other path naming `fixtures` is the examples/fixtures index.
 */
export function storyRelativeTargets(root, from, name) {
  const fixture = /^(?:\.\.\/)+_fixtures\/(.+)$/.exec(name)?.[1];
  const rewritten =
    fixture !== undefined
      ? resolveRelative(join(root, 'examples', 'src', 'app', '_fixtures', 'x.ts'), `./${fixture}`)
      : /^(?:\.\.\/)+[^']*fixtures/.test(name)
        ? join(root, 'examples', 'fixtures', 'index.ts')
        : undefined;
  return [...new Set([resolveRelative(from, name), rewritten].filter((path) => path !== undefined && existsSync(path)))];
}

/**
 * The graph the scope reads, from the working tree: every entry point and
 * the entries it imports; per story route the entries and example files it
 * reaches; the route prefixes each spec visits; and the entries and files
 * the examples app shell reaches.
 */
export function readGraph(root = ROOT) {
  const rel = (path) => relative(root, path).split('\\').join('/');
  const entries = walk(join(root, 'projects'), (path) => path.endsWith('ng-package.json')).map(
    (path) => `@cngx/${rel(dirname(path)).slice('projects/'.length)}`,
  );
  const libs = [...new Set(entries.map((entry) => entry.split('/')[1]))];
  const owned = (names) =>
    names.filter((name) => name.startsWith('@cngx/')).map((name) => ownerEntry(entries, name)).filter(Boolean);
  const imports = Object.fromEntries(entries.map((entry) => [entry, new Set()]));
  for (const file of walk(join(root, 'projects'), (path) => path.endsWith('.ts') && !path.endsWith('.spec.ts'))) {
    const owner = entryOfFile(entries, rel(file));
    for (const target of owner === undefined ? [] : owned(sourceImports(readFileSync(file, 'utf8')))) {
      if (target !== owner) {
        imports[owner].add(target);
      }
    }
  }

  // Public symbols and selectors, so a name in a story's `imports`,
  // `hostDirectives` or template reaches the entry that exports it.
  const symbols = new Map();
  const mark = (key, entry) => symbols.set(key, new Set([...(symbols.get(key) ?? []), entry]));
  const exportedNames = (file, seen = new Set()) => {
    if (file === undefined || seen.has(file)) {
      return [];
    }
    seen.add(file);
    const text = readFileSync(file, 'utf8');
    const listed = [...text.matchAll(/export\s+(?:type\s+)?\{([^}]+)\}/g)].flatMap(([, list]) =>
      list.split(',').map((raw) => raw.trim().replace(/^type\s+/, '').split(/\s+as\s+/).at(-1)),
    );
    const declared = [
      ...text.matchAll(/export\s+(?:declare\s+)?(?:abstract\s+)?(?:const|let|function|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g),
    ].map(([, name]) => name);
    const starred = [...text.matchAll(/export\s+\*\s+from\s+'(\.[^']+)'/g)].flatMap(([, name]) =>
      exportedNames(resolveRelative(file, name), seen),
    );
    return [...listed, ...declared, ...starred].filter(Boolean);
  };
  for (const entry of entries) {
    const api = join(root, 'projects', entry.slice('@cngx/'.length), 'public-api.ts');
    for (const name of existsSync(api) ? exportedNames(api) : []) {
      mark(name, entry);
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

  // What one file reaches on its own: entries, and the files it imports by a
  // relative path inside examples/. A story (or a shell file) also reaches
  // what its symbols name, since the generator imports those.
  // Only tracked files: the generated routes and feature components are
  // gitignored, so a local tree follows the same imports the CI checkout has.
  const tracked = new Set(trackedFiles(root, 'examples'));
  const ownReach = new Map();
  const unresolved = [];
  const reachOfFile = (file, story) => {
    const key = `${file}${story ? '#story' : ''}`;
    if (!ownReach.has(key)) {
      const text = readFileSync(file, 'utf8');
      const names = story ? [...new Set([...importStrings(text), ...sourceImports(text)])] : sourceImports(text);
      // The DemoSpec type import is the story contract, never part of the page.
      const relatives = names
        .filter((name) => name.startsWith('.') && !name.includes('dev-tools/'))
        .flatMap((name) => {
          const targets = story ? storyRelativeTargets(root, file, name) : [resolveRelative(file, name)].filter(Boolean);
          if (targets.length === 0 && story) {
            unresolved.push(`${rel(file)}: ${name}`);
          }
          return targets;
        })
        .filter((path) => tracked.has(rel(path)));
      ownReach.set(key, { entries: [...owned(names), ...(story ? named(text) : [])], relatives });
    }
    return ownReach.get(key);
  };
  // A file and everything it imports by a relative path, transitively.
  const reachOf = (file, story) => {
    const files = new Set();
    const reached = new Set();
    const queue = [[file, story]];
    while (queue.length > 0) {
      const [next, root] = queue.shift();
      if (files.has(next)) {
        continue;
      }
      files.add(next);
      const own = reachOfFile(next, root);
      own.entries.forEach((entry) => reached.add(entry));
      queue.push(...own.relatives.map((path) => [path, false]));
    }
    return { entries: reached, files: new Set([...files].map(rel)) };
  };

  const routes = {};
  for (const file of walk(join(root, 'examples', 'stories'), (path) => path.endsWith('.story.ts'))) {
    routes[STORY.exec(rel(file))[1]] = reachOf(file, true);
  }
  const specs = {};
  for (const file of walk(join(root, 'examples', 'e2e'), (path) => path.endsWith('.e2e-spec.ts'))) {
    specs[rel(file)] = specRoutes(readFileSync(file, 'utf8'), libs);
  }
  const shellReach = shellSources(root).map((file) => reachOf(file, false));
  const shell = {
    entries: new Set(shellReach.flatMap((reach) => [...reach.entries])),
    files: new Set(shellReach.flatMap((reach) => [...reach.files])),
  };
  return { entries, imports, routes, specs, shell, unresolved };
}

// The tracked files under `dir`, repo-relative.
function trackedFiles(root, dir) {
  return execFileSync('git', ['ls-files', '--', dir], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean);
}

// The app shell's own sources: the tracked TypeScript under examples/src.
function shellSources(root) {
  return trackedFiles(root, 'examples/src')
    .filter((path) => path.endsWith('.ts') && !path.endsWith('.spec.ts'))
    .map((path) => join(root, path))
    .filter((path) => existsSync(path));
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

/**
 * What a pull request with `files` changed has to run: `all`, `none`, or the
 * affected routes and the spec files that visit them.
 */
export function scopeFor(files, graph) {
  const changedEntries = new Set();
  const changedExamples = new Set();
  const routes = new Set();
  const changedSpecs = new Set();
  for (const file of files) {
    if (IGNORED.some((pattern) => pattern.test(file))) {
      continue;
    }
    const story = STORY.exec(file)?.[1];
    const spec = SPEC.test(file) ? file : BASELINE.exec(file)?.[1];
    const lib = LIB_SOURCE.exec(file)?.[1];
    const entry = lib === undefined || GLOBAL_THEMING.test(file) ? undefined : entryOfFile(graph.entries, file);
    if (story !== undefined) {
      routes.add(story);
    } else if (spec !== undefined) {
      changedSpecs.add(spec);
    } else if (entry !== undefined) {
      changedEntries.add(entry);
    } else if (EXAMPLE_SOURCE.test(file) && !graph.shell.files.has(file)) {
      changedExamples.add(file);
    } else {
      return { mode: 'all', reason: file };
    }
  }
  const affected = withDependents(graph, changedEntries);
  const taken = new Set();
  for (const [route, reach] of Object.entries(graph.routes)) {
    const viaFile = [...changedExamples].filter((file) => reach.files.has(file));
    viaFile.forEach((file) => taken.add(file));
    if (viaFile.length > 0 || [...reach.entries].some((entry) => affected.has(entry))) {
      routes.add(route);
    }
  }
  // A helper or fixture no story reaches still compiles into the app.
  const orphan = [...changedExamples].find((file) => !taken.has(file));
  if (orphan !== undefined) {
    return { mode: 'all', reason: `${orphan} (no story reaches it)` };
  }
  // Every route renders the app shell, so the selected ones cover a change
  // the shell imports; with no route selected only a full run would.
  const shellHit = [...graph.shell.entries].find((entry) => affected.has(entry));
  if (shellHit !== undefined && routes.size === 0) {
    return { mode: 'all', reason: `${shellHit} (the examples app shell imports it)` };
  }
  const selected = [...routes];
  const specs = Object.entries(graph.specs)
    .filter(
      ([path, visits]) =>
        changedSpecs.has(path) ||
        (selected.length > 0 && (visits === undefined || visits.length === 0)) ||
        (visits ?? []).some((prefix) => selected.some((route) => covers(prefix, route))),
    )
    .map(([path]) => path)
    .sort();
  if (selected.length === 0 && specs.length === 0) {
    return { mode: 'none' };
  }
  return { mode: 'some', routes: selected.sort(), specs };
}

// Full runs: examples-e2e takes 11 to 13 minutes on two workers and the
// sweep 10 to 12 on four, so three and two shards keep each near 4 and 6.
export const FULL_SHARDS = { examples: 3, sweep: 2 };
// About how much one shard takes on before a second one pays for its own
// install and `ng serve`.
const SPECS_PER_SHARD = 40;
const ROUTES_PER_SHARD = 400;

/** The console-sweep title filter: the allowlist checks and the selected routes; empty runs every route. */
export function sweepGrep(routes) {
  const exact = routes.map((route) => `(?:^| )${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
  const grep = ['console allowlist', ...exact].join('|');
  return grep.length > MAX_GREP ? '' : grep;
}

/** The shard numbers of each suite's matrix for a scope; a small selection runs on fewer runners. */
export function shardsFor(scope) {
  const list = (count) => Array.from({ length: count }, (_, index) => index + 1);
  if (scope.mode !== 'some') {
    return { examples: list(FULL_SHARDS.examples), sweep: list(FULL_SHARDS.sweep) };
  }
  const count = (size, per, max) => Math.max(1, Math.min(max, Math.ceil(size / per)));
  const sweepAll = sweepGrep(scope.routes) === '';
  return {
    examples: list(count(scope.specs.length, SPECS_PER_SHARD, FULL_SHARDS.examples)),
    sweep: list(sweepAll ? FULL_SHARDS.sweep : count(scope.routes.length, ROUTES_PER_SHARD, FULL_SHARDS.sweep)),
  };
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
    console.log(`e2e scope: ${scope.routes.length} routes, ${scope.specs.length} spec files`);
    scope.routes.forEach((route) => console.log(`  route ${route}`));
    scope.specs.forEach((spec) => console.log(`  spec ${spec}`));
    lines.push(`specs=${specFilters(scope.specs).join(' ')}`, `grep=${sweepGrep(scope.routes)}`);
  }
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${lines.join('\n')}\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
