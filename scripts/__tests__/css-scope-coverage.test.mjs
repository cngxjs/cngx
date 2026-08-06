import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Inventory over the layout-bearing `@scope` stylesheets: does a geometry spec
 * exist for this stylesheet's component?
 *
 * It measures SPEC EXISTENCE, not rule coverage - a stylesheet counts as
 * "guarded" when a `*.geometry.spec.ts` sits in its component folder (or the
 * parent, for a `styles/` sub-file), NOT when every rule it declares is
 * asserted. The honest denominator is the set of `@scope` stylesheets that
 * carry a layout property (`grid-template` / `grid-area` / `@container` /
 * `container-type` / `inline-size` / `block-size` / `flex-direction` /
 * non-static `position`); a `@scope` file that only assigns colour tokens lays
 * nothing out and is not counted.
 *
 * REPORTING ONLY in this release: the unclassified count is a `console.warn`
 * and an `it.todo`, not a failing assertion. Phase 4 flips the todo to
 * `expect(unclassified).toEqual([])`. Structure mirrors
 * `css-density-property-guard.test.mjs` - same walk, same `Map`-with-reasons
 * allowlist, same failure-message style - rather than inventing a second
 * mechanism for the same job.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const PROJECTS = resolve(REPO_ROOT, 'projects');

/** Skin stylesheets are variant-gated (`[data-skin]`) and carry no default
 * geometry, so a "does the default lay out correctly" guard does not apply to
 * them. Theme bridges assign tokens, they do not lay out. Both are structural
 * exemptions, not gaps. */
function isStructurallyExempt(relPath) {
  return relPath.includes('/themes/') || /-skins?\.css$/.test(relPath);
}

/** Layout-bearing `@scope` stylesheets whose geometry is guarded somewhere the
 * folder heuristic cannot see (a sibling lib, a shared base). Each entry names
 * where the guard actually lives. The escape hatch, not a dumping ground -
 * currently empty: every unguarded stylesheet this release is a genuine gap in
 * the reported count, not a mislabeled one. */
const SCOPE_COVERAGE_ALLOWLIST = new Map([]);

// --- helpers ---------------------------------------------------------------

function walk(dir, predicate, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, predicate, out);
    } else if (predicate(entry)) {
      out.push(full);
    }
  }
  return out;
}

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, ' ');
}

const HAS_SCOPE = /@scope\b/;
const LAYOUT_PROP =
  /grid-template|grid-area|@container|container-type|\binline-size\b|\bblock-size\b|flex-direction|position:\s*(relative|absolute|fixed|sticky)/;

function isLayoutBearingScope(css) {
  return HAS_SCOPE.test(css) && LAYOUT_PROP.test(css);
}

const toRel = (full) => '/' + relative(REPO_ROOT, full).replaceAll('\\', '/');

// Directories (and their parents) that hold a *.geometry.spec.ts. A stylesheet
// in `<comp>/` or `<comp>/styles/` is guarded when `<comp>/` carries a spec.
const GEOMETRY_SPEC_DIRS = new Set(
  walk(PROJECTS, (e) => e.endsWith('.geometry.spec.ts')).map((f) => dirname(f)),
);

function isGuarded(cssFull) {
  const dir = dirname(cssFull);
  return GEOMETRY_SPEC_DIRS.has(dir) || GEOMETRY_SPEC_DIRS.has(dirname(dir));
}

// --- the suite -------------------------------------------------------------

const LAYOUT_SCOPE_FILES = walk(PROJECTS, (e) => e.endsWith('.css'))
  .map((full) => ({ full, rel: toRel(full) }))
  .filter(({ full }) => isLayoutBearingScope(stripComments(readFileSync(full, 'utf8'))));

describe('css @scope layout-coverage inventory (spec existence, not rule coverage)', () => {
  it('reports guarded / allowlisted / unclassified counts (non-blocking this release)', () => {
    const guarded = [];
    const allowlisted = [];
    const exempt = [];
    const unclassified = [];

    for (const { full, rel } of LAYOUT_SCOPE_FILES) {
      if (isStructurallyExempt(rel)) {
        exempt.push(rel);
      } else if (isGuarded(full)) {
        guarded.push(rel);
      } else if (SCOPE_COVERAGE_ALLOWLIST.has(rel)) {
        allowlisted.push(rel);
      } else {
        unclassified.push(rel);
      }
    }

    const classified = guarded.length + allowlisted.length;
    console.warn(
      `[css-scope-coverage] layout-bearing @scope stylesheets: ${LAYOUT_SCOPE_FILES.length}` +
        ` (skin/theme-exempt ${exempt.length}). ` +
        `guarded ${guarded.length}, allowlisted ${allowlisted.length}, unclassified ${unclassified.length}.`,
    );
    if (unclassified.length) {
      console.warn(
        `[css-scope-coverage] unclassified (no geometry spec, no allowlist entry):\n` +
          unclassified.map((r) => `  ${r}`).join('\n'),
      );
    }

    // Non-blocking this release: the count is a report, not a gate. The two
    // sanity checks below just keep the inventory itself honest.
    expect(classified).toBeGreaterThan(0);
    expect(guarded.length).toBeGreaterThan(0);
  });

  it.todo(
    'every layout-bearing @scope stylesheet is guarded or allowlisted (Phase 4: flip to expect(unclassified).toEqual([]))',
  );
});
