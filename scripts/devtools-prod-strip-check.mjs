// Fails when cngx dev-only code reaches the production examples bundle. Every
// dev-mode branch the libraries add sits behind
// `typeof ngDevMode !== 'undefined' && ngDevMode`, which a production build
// folds to `false` and drops. This proves it on the real bundle.
//
// The needles are derived from source, never kept by hand:
// - the `cngx-dev:` marker every dev descriptor `kind` carries;
// - every hand-written `debugName` value in projects/** (specs excluded).
//   Compiler-inserted names never appear in source, so only hand-written ones
//   need checking. A hand-written name must be a dotted `<owner>.<signal>`
//   string literal, so the needle is specific enough to search a bundle for.
//   It only counts as a hit when quoted: a dotted name can also read as a
//   member chain in app code (`host.treeController.isExpanded(id)`), but a
//   debugName can only reach a bundle as a string literal.
//
// Positive control: every needle must be present in the library build
// (dist/<lib>/fesm2022/*.mjs), where the dev branches survive. A needle the
// library build does not contain means the derivation no longer matches the
// emitted code, and a clean production scan would prove nothing.
//
// Exit codes: 0 clean, 1 needle found in the production bundle, 2 bundle or
// library build missing (a skipped build must not pass), 3 a hand-written
// `debugName` breaks the naming contract, 4 a needle is missing from the
// library build.
//
// Usage: node scripts/devtools-prod-strip-check.mjs [--dist <dir>] [--lib-dist <dir>] [--source <dir>]

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

import { isToolingRoot } from './__tests__/source-roots.mjs';

export const MARKER = 'cngx-dev:';
export const DEBUG_NAME_PATTERN = /^[a-z][A-Za-z0-9]*(\.[a-z][A-Za-z0-9]*)+$/;

const DEFAULT_DIST = 'dist/examples/browser';
const DEFAULT_LIB_DIST = 'dist';
const DEFAULT_SOURCE = 'projects';
const SKIPPED_DIRS = new Set(['node_modules', 'dist', '.angular']);

// `files` is [{ path, text }] of library sources. Returns the needles plus
// every `debugName` that breaks the naming contract.
export function deriveNeedles(files) {
  const needles = [MARKER];
  const violations = [];
  for (const { path, text } of files) {
    if (isSpec(path)) {
      continue;
    }
    for (const match of text.matchAll(/\bdebugName\s*:\s*/g)) {
      const start = match.index + match[0].length;
      const line = text.slice(0, match.index).split('\n').length;
      const literal = /^(['"])([^'"\n]*)\1/.exec(text.slice(start));
      if (!literal) {
        const found = text.slice(start).split('\n')[0].trim();
        violations.push({ file: path, line, value: found, reason: 'not a plain string literal' });
        continue;
      }
      const value = literal[2];
      if (!DEBUG_NAME_PATTERN.test(value)) {
        violations.push({ file: path, line, value, reason: 'not a dotted <owner>.<signal> name' });
        continue;
      }
      if (!needles.includes(value)) {
        needles.push(value);
      }
    }
  }
  return { needles, violations };
}

const QUOTES = new Set(["'", '"', '`']);

// `files` is [{ path, text }] of bundle chunks. Returns one hit per needle
// occurrence: the marker anywhere, a debugName only as a whole quoted string.
export function scanBundle(files, needles) {
  const hits = [];
  for (const { path, text } of files) {
    for (const needle of needles) {
      let offset = text.indexOf(needle);
      while (offset !== -1) {
        if (needle === MARKER || isQuoted(text, offset, needle.length)) {
          hits.push({ file: path, offset, needle });
        }
        offset = text.indexOf(needle, offset + needle.length);
      }
    }
  }
  return hits;
}

function isQuoted(text, offset, length) {
  const before = text[offset - 1];
  return QUOTES.has(before) && text[offset + length] === before;
}

function isSpec(path) {
  return /\.spec\.ts$/.test(path);
}

// Tooling roots (`projects/*/schematics`) never reach a browser bundle, so
// they are skipped like in every other guard that walks projects/.
function collect(dir, accept) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (SKIPPED_DIRS.has(name)) {
      continue;
    }
    const abs = join(dir, name);
    if (isToolingRoot(relative(process.cwd(), abs).split(sep).join('/'))) {
      continue;
    }
    if (statSync(abs).isDirectory()) {
      out.push(...collect(abs, accept));
    } else if (accept(name)) {
      out.push(abs);
    }
  }
  return out;
}

// The library sources the needles are derived from, repo-relative.
export function sourceFiles(dir = DEFAULT_SOURCE) {
  return collect(resolve(dir), (name) => name.endsWith('.ts')).map((abs) =>
    relative(process.cwd(), abs),
  );
}

function readAll(dir, accept) {
  return collect(dir, accept).map((abs) => ({
    path: relative(process.cwd(), abs),
    text: readFileSync(abs, 'utf8'),
  }));
}

function argValue(argv, flag, fallback) {
  const index = argv.indexOf(flag);
  return index === -1 ? fallback : argv[index + 1];
}

export function run(argv) {
  const dist = resolve(argValue(argv, '--dist', DEFAULT_DIST));
  const libDist = resolve(argValue(argv, '--lib-dist', DEFAULT_LIB_DIST));
  const source = resolve(argValue(argv, '--source', DEFAULT_SOURCE));

  const { needles, violations } = deriveNeedles(readAll(source, (name) => name.endsWith('.ts')));
  if (violations.length > 0) {
    process.stderr.write(
      `prod-strip - ${violations.length} hand-written debugName(s) break the naming contract:\n`,
    );
    for (const v of violations) {
      process.stderr.write(`  ${v.file}:${v.line} ${JSON.stringify(v.value)} (${v.reason})\n`);
    }
    process.stderr.write(
      '  A hand-written debugName must be a plain string literal matching <owner>.<signal>.\n',
    );
    return 3;
  }

  if (!existsSync(libDist)) {
    process.stderr.write(
      `prod-strip - no library build at ${relative(process.cwd(), libDist)}. Run npm run build:libs first.\n`,
    );
    return 2;
  }
  const libraryHits = scanBundle(
    readAll(libDist, (name) => name.endsWith('.mjs')),
    needles,
  );
  const missing = needles.filter((needle) => !libraryHits.some((hit) => hit.needle === needle));
  if (missing.length > 0) {
    process.stderr.write(
      `prod-strip - ${missing.length} needle(s) missing from the library build, so the scan would prove nothing:\n`,
    );
    for (const needle of missing) {
      process.stderr.write(`  ${JSON.stringify(needle)}\n`);
    }
    process.stderr.write(
      '  Rebuild with npm run build:libs; if it persists, the derivation drifted.\n',
    );
    return 4;
  }

  if (!existsSync(dist)) {
    process.stderr.write(
      `prod-strip - no production bundle at ${relative(process.cwd(), dist)}. Run npm run build:examples first.\n`,
    );
    return 2;
  }

  const hits = scanBundle(
    readAll(dist, (name) => name.endsWith('.js')),
    needles,
  );
  if (hits.length > 0) {
    process.stderr.write(
      `prod-strip - ${hits.length} dev-only needle(s) in the production bundle:\n`,
    );
    for (const hit of hits) {
      process.stderr.write(`  ${hit.file} @${hit.offset} ${JSON.stringify(hit.needle)}\n`);
    }
    process.stderr.write(
      "  Guard the code with `typeof ngDevMode !== 'undefined' && ngDevMode`.\n",
    );
    return 1;
  }

  process.stdout.write(`prod-strip - clean (${needles.length} needle(s) checked)\n`);
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = run(process.argv.slice(2));
}
