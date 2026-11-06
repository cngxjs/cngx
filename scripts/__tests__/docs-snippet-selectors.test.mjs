import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * Guard for documentation HTML snippets that bind against a select-family
 * selector or input that does not exist. A fenced `html` block in a consumer
 * README or a core-concepts guide is copy-paste code; a wrong element tag
 * (`<cngx-select-option>` for `<cngx-option>`) or a wrong binding
 * (`[(value)]` where the control exposes `values`) compiles nowhere and
 * teaches the wrong API.
 *
 * Scope: fenced ```html blocks in `projects/forms/select/**\/README.md`
 * (minus `**\/internal/**`, which document internal composition against
 * `@internal` selectors that never reach the public export) and
 * `core-concepts/*.md`. Every `<cngx-*>` element and its `[x]` / `[(x)]` /
 * `(x)` bindings are resolved against the compodocx JSON export
 * (`npm run docs:json`) - element selectors plus the inputs and outputs a host
 * directive exposes, the same surface the API tab documents.
 *
 * Known failures are the exact list below with their finding id. A new
 * mismatch fails the guard (fix the snippet, do not add a row); a row that no
 * longer reproduces fails it too (the snippet was fixed - drop the row). The
 * strand-B docs phase empties this list.
 *
 * Needs a fresh `.compodoc/documentation.json`; CI builds it before
 * `test:scripts`.
 */

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const DOC_PATH = resolve(REPO_ROOT, '.compodoc/documentation.json');

/**
 * Fenced-html snippet bindings that target a selector or input not in the
 * public export. `{ finding, file, line, kind, tag, binding? }`; the finding id
 * is documentation, the key for the diff is file:line + kind + tag + binding.
 */
const KNOWN_FAILURES = [
  // Empty: every documentation snippet now binds a real selector and input.
];

/** Bindings that are Angular common directives or native DOM, never a cngx input. */
const NATIVE_BINDINGS = new Set([
  'ngIf', 'ngForOf', 'ngModel', 'ngClass', 'ngStyle', 'ngTemplateOutlet',
  'click', 'input', 'change', 'focus', 'blur', 'keydown', 'keyup', 'keypress',
  'submit', 'mousedown', 'mouseup', 'mouseenter', 'mouseleave', 'pointerdown',
]);

function loadExport() {
  if (!existsSync(DOC_PATH)) throw new Error('run npm run docs:json first');
  const exported = JSON.parse(readFileSync(DOC_PATH, 'utf8'));
  if (exported.schemaVersion !== 7) throw new Error('schemaVersion 7 expected');
  const installed = JSON.parse(
    readFileSync(resolve(REPO_ROOT, 'node_modules/@cngxjs/compodocx/package.json'), 'utf8'),
  ).version;
  if (exported.compodocxVersion !== installed) {
    throw new Error('stale docs JSON: regenerate with npm run docs:json');
  }
  return exported;
}

/** Element-form tag names of a (possibly comma-separated) selector string. */
function elementTagsOf(selector) {
  if (typeof selector !== 'string') return [];
  return selector
    .split(',')
    .map((part) => part.trim().match(/^([a-z][a-z0-9-]*)(?![\w-])/i))
    .filter(Boolean)
    .map((match) => match[1]);
}

/** Public binding name of a host-directive `inputs`/`outputs` entry (`internal: public`). */
function publicName(entry) {
  const parts = entry.split(':');
  return (parts[1] ?? parts[0]).trim();
}

/** Map every cngx element tag to the set of bindings the export exposes on it. */
function resolveTagBindings(exported) {
  const owners = [...(exported.components ?? []), ...(exported.directives ?? [])];
  const tagBindings = new Map();
  for (const owner of owners) {
    const bindings = new Set();
    for (const input of owner.inputsClass ?? []) bindings.add(input.alias || input.name);
    for (const output of owner.outputsClass ?? []) bindings.add(output.alias || output.name);
    for (const host of owner.hostDirectives ?? []) {
      for (const entry of host.inputs ?? []) bindings.add(publicName(entry));
      for (const entry of host.outputs ?? []) bindings.add(publicName(entry));
    }
    for (const tag of elementTagsOf(owner.selector)) {
      if (!tag.startsWith('cngx-')) continue;
      const set = tagBindings.get(tag) ?? new Set();
      for (const binding of bindings) set.add(binding);
      tagBindings.set(tag, set);
    }
  }
  return tagBindings;
}

function docFiles() {
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'internal') continue;
        walk(path);
      } else if (entry.name === 'README.md') {
        files.push(path);
      }
    }
  };
  walk(resolve(REPO_ROOT, 'projects/forms/select'));
  const concepts = resolve(REPO_ROOT, 'core-concepts');
  for (const name of readdirSync(concepts)) {
    if (name.endsWith('.md')) files.push(join(concepts, name));
  }
  return files.sort();
}

const TAG_RE = /<(cngx-[a-z0-9-]+)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
const BIND_RE = /\[\(([\w-]+)\)\]|\[([\w.-]+)\]|\(([\w-]+)\)/g;

/** Scan one file's fenced-html snippets for unknown tags and bindings. */
function scanFile(path, tagBindings) {
  const rel = path.replace(REPO_ROOT + '/', '');
  const lines = readFileSync(path, 'utf8').split('\n');
  const rows = [];
  let inHtml = false;
  let tags = 0;
  for (let i = 0; i < lines.length; i++) {
    const fence = lines[i].match(/^```(\w+)?/);
    if (fence) {
      inHtml = inHtml ? false : fence[1] === 'html';
      continue;
    }
    if (!inHtml) continue;
    const lineNo = i + 1;
    let tagMatch;
    TAG_RE.lastIndex = 0;
    while ((tagMatch = TAG_RE.exec(lines[i]))) {
      tags++;
      const tag = tagMatch[1];
      const attrs = tagMatch[2];
      if (!tagBindings.has(tag)) {
        rows.push({ file: rel, line: lineNo, kind: 'unknown-tag', tag });
        continue;
      }
      const known = tagBindings.get(tag);
      let bindMatch;
      BIND_RE.lastIndex = 0;
      while ((bindMatch = BIND_RE.exec(attrs))) {
        const name = bindMatch[1] || bindMatch[2] || bindMatch[3];
        if (!name || name.includes('.') || NATIVE_BINDINGS.has(name)) continue;
        if (!known.has(name)) {
          rows.push({ file: rel, line: lineNo, kind: 'unknown-binding', tag, binding: name });
        }
      }
    }
  }
  return { rows, tags };
}

function scan() {
  const tagBindings = resolveTagBindings(loadExport());
  const rows = [];
  let tags = 0;
  for (const path of docFiles()) {
    const result = scanFile(path, tagBindings);
    rows.push(...result.rows);
    tags += result.tags;
  }
  return { rows, tags, tagCount: tagBindings.size };
}

const key = (row) => `${row.file}:${row.line} ${row.kind} ${row.tag}${row.binding ? ` [${row.binding}]` : ''}`;

/** Rows of `from` left after removing one match per row of `remove`, by key. */
function subtract(from, remove) {
  const counts = new Map();
  for (const row of remove) counts.set(key(row), (counts.get(key(row)) ?? 0) + 1);
  const left = [];
  for (const row of from) {
    const k = key(row);
    if ((counts.get(k) ?? 0) > 0) counts.set(k, counts.get(k) - 1);
    else left.push(row);
  }
  return left;
}

describe('docs snippet selectors (repo)', () => {
  const result = scan();

  it('resolves the select-family element selectors', () => {
    expect(result.tagCount).toBeGreaterThan(100);
    expect(result.tags).toBeGreaterThan(50);
  });

  it('lists every snippet mismatch in the known-failure list', () => {
    expect(
      subtract(result.rows, KNOWN_FAILURES).map(key),
      'a snippet binds a selector or input that does not exist: fix the snippet, never add a row',
    ).toEqual([]);
  });

  it('keeps only snippets that still mismatch', () => {
    expect(
      subtract(KNOWN_FAILURES, result.rows).map(key),
      'regenerate with npm run docs:json first; still listed means the snippet was fixed - drop the row',
    ).toEqual([]);
  });
});
