import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Repo-wide static guard for the registered-property cascade trap.
 *
 * A custom property registered with `@property { inherits: false }` never
 * reaches a descendant: every element that does not set it itself computes the
 * registered `initial-value`. A delegating assignment on `:root` / `html`
 * (`--cngx-x-color: var(--cngx-color-danger)`) therefore lands on the root
 * element only, and every component that reads the token paints the fixed
 * initial instead. Light mode hides the defect when the initial happens to
 * match the light value; dark mode and a re-themed foundation colour expose it.
 *
 * The guard collects every `@property` with `inherits: false` across
 * `projects/**` stylesheets (`.css` and `.scss`) and fails when the same
 * property is assigned in a rule whose selector targets `:root` or `html`. The
 * fix is `inherits: true` (or a SET at the element that reads it), never an
 * allow-list entry: the root assignment is dead by construction.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const PROJECTS = resolve(REPO_ROOT, 'projects');

// --- helpers ---------------------------------------------------------------

function walkStyles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules') {
      continue;
    }
    const full = resolve(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walkStyles(full));
    } else if (/\.(css|scss)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
}

const PROPERTY_BLOCK = /@property\s+(--[a-z0-9-]+)\s*\{([^}]*)\}/gi;

/** Names of every property registered with `inherits: false` in `source`. */
function nonInheritingProperties(source) {
  const names = new Set();
  PROPERTY_BLOCK.lastIndex = 0;
  let m;
  while ((m = PROPERTY_BLOCK.exec(source)) !== null) {
    if (/inherits\s*:\s*false/i.test(m[2])) {
      names.add(m[1]);
    }
  }
  return names;
}

const ROOT_SELECTOR = /(^|[\s,(>+~])(:root|html)(?![\w-])/;

/**
 * Every custom property assigned inside a rule whose selector targets `:root`
 * or `html`. Brace-matched, so the rule may sit inside `@layer` / `@media` /
 * `@supports`; at-rule preludes are never treated as selectors.
 */
function rootAssignments(source) {
  const found = [];
  const stack = [];
  let boundary = 0;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') {
      stack.push({ prelude: source.slice(boundary, i).trim(), start: i + 1 });
      boundary = i + 1;
    } else if (ch === ';') {
      boundary = i + 1;
    } else if (ch === '}') {
      const rule = stack.pop();
      boundary = i + 1;
      if (!rule || rule.prelude.startsWith('@') || !ROOT_SELECTOR.test(rule.prelude)) {
        continue;
      }
      const body = source.slice(rule.start, i);
      for (const decl of body.matchAll(/(?<![\w-])(--[a-z0-9-]+)\s*:/gi)) {
        found.push({ selector: rule.prelude.replace(/\s+/g, ' '), name: decl[1] });
      }
    }
  }
  return found;
}

// --- the suite -------------------------------------------------------------

const STYLE_FILES = walkStyles(PROJECTS).map((full) => ({
  rel: '/' + relative(REPO_ROOT, full).replaceAll('\\', '/'),
  source: stripComments(readFileSync(full, 'utf8')),
}));

describe('non-inheriting @property detection', () => {
  it('collects only the inherits: false registrations', () => {
    const names = nonInheritingProperties(`
      @property --a { syntax: '<color>'; inherits: false; initial-value: red; }
      @property --b { syntax: '<color>'; inherits: true; initial-value: red; }
    `);
    expect([...names]).toEqual(['--a']);
  });

  it('finds a :root assignment nested in @layer and @media', () => {
    const found = rootAssignments(`
      @layer cngx.tokens {
        @media (prefers-color-scheme: dark) {
          :root:not([data-color-scheme='light']) { --a: blue; }
        }
      }
    `);
    expect(found.map((f) => f.name)).toEqual(['--a']);
  });

  it('finds an html assignment and ignores look-alike selectors', () => {
    const found = rootAssignments(`
      html.dark { --a: blue; }
      .html-preview { --b: blue; }
      .x { --c: blue; }
    `);
    expect(found.map((f) => f.name)).toEqual(['--a']);
  });
});

/**
 * OD4: every `@property` registered under `projects/forms/select` is
 * `inherits: true`, because each is set on the host (or a colour-scheme island
 * ancestor) and read on a descendant - the panel, an option, a chip, a tree
 * node. A registered `inherits: false` there is the cascade trap this strand
 * closes. A token that genuinely must stay `inherits: false` goes in the map
 * with a one-clause reason; the count is exact, so a new `inherits: false`
 * select token fails the guard.
 */
const SELECT_INHERITS_FALSE_EXEMPT = new Map([
  // Empty: no select @property stays non-inheriting after OD4.
]);

function selectNonInheriting() {
  const names = new Set();
  for (const { rel, source } of STYLE_FILES) {
    if (!rel.startsWith('/projects/forms/select/')) {
      continue;
    }
    for (const name of nonInheritingProperties(source)) {
      names.add(name);
    }
  }
  return names;
}

describe('select @property inherits (OD4)', () => {
  it('registers every select token inherits: true unless exempted', () => {
    const offenders = [...selectNonInheriting()].filter(
      (name) => !SELECT_INHERITS_FALSE_EXEMPT.has(name),
    );
    expect(
      offenders,
      `these select @property tokens are inherits: false, so a host-level or scheme-island override never reaches the descendant that reads them (register inherits: true, or add an exempt row with a reason):\n${offenders.join('\n')}`,
    ).toEqual([]);
  });

  it('keeps the exemption table exact', () => {
    const nonInheriting = selectNonInheriting();
    const stale = [...SELECT_INHERITS_FALSE_EXEMPT.keys()].filter((name) => !nonInheriting.has(name));
    expect(stale, 'an exempt token is no longer inherits: false - drop its row').toEqual([]);
  });
});

describe('css @property inherits regression guard', () => {
  it('no inherits: false @property is assigned on :root or html', () => {
    const nonInheriting = new Set();
    for (const { source } of STYLE_FILES) {
      for (const name of nonInheritingProperties(source)) {
        nonInheriting.add(name);
      }
    }
    const offenders = [];
    for (const { rel, source } of STYLE_FILES) {
      for (const { selector, name } of rootAssignments(source)) {
        if (nonInheriting.has(name)) {
          offenders.push(`${rel}: ${name} assigned in '${selector}'`);
        }
      }
    }
    expect(
      offenders,
      `these tokens are registered with inherits: false, so a :root / html assignment never reaches the element that reads them (register them inherits: true, or SET them where they are read):\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});
