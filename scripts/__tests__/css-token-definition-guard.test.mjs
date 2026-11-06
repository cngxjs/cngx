import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Repo-wide static guard for two token-read defects no other gate sees.
 *
 * Rule A - undefined palette read. A component stylesheet that reads a
 * palette-family token (`var(--cngx-color-*)`, `--cngx-space-*`, ...) the
 * default palette never defines paints its fallback in a plain cngx app and the
 * bridge value only under a theme bridge. The solid button's
 * `--cngx-color-on-primary` read was exactly that: defined by the Material
 * bridge only, so the default theme failed WCAG AA. The palette families are
 * derived from what `projects/core/theming/**` defines, and a read counts as
 * defined only when `projects/core/theming/**` declares or registers the
 * token. A bridge definition (`projects/themes/**`) satisfies a read inside
 * `projects/themes/**` only, which is why that tree is not scanned: for a
 * component stylesheet the default palette is the contract.
 *
 * Rule B - dead fallback on a sentinel registration. A property registered via
 * `@property` always resolves, so `var(--p, fallback)` never uses its fallback.
 * When the registered `initial-value` is a sentinel (`transparent`, `none`,
 * `0`, `0px`, `initial`) and the fallback is a real value, the author meant the
 * fallback but the sentinel paints. Static stand-in for "never set on an
 * ancestor rule": the guard cannot see the runtime cascade, so a row whose
 * property IS set by an ancestor component is allowlisted with that reason.
 * A sentinel or `inherit` fallback is consistent with the initial and passes.
 *
 * The allowlist is an exact-set ratchet: a new offender fails, and a row that
 * no longer matches fails as stale, so every closed defect removes its row.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const PROJECTS = resolve(REPO_ROOT, 'projects');
const THEMING = resolve(PROJECTS, 'core', 'theming');

// --- pure scan functions -----------------------------------------------------

/** Removes every block comment, so documented tokens are not read as uses. */
export function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, ' ');
}

/** Every custom property declared or registered in `source`. */
export function definedProperties(source) {
  const names = new Set();
  for (const m of source.matchAll(/(?<![\w-])(--cngx-[a-z0-9-]+)\s*:/g)) {
    names.add(m[1]);
  }
  for (const m of source.matchAll(/@property\s+(--cngx-[a-z0-9-]+)/g)) {
    names.add(m[1]);
  }
  return names;
}

/** The family segment of a `--cngx-<family>-...` name. */
export function familyOf(name) {
  return name.slice('--cngx-'.length).split('-')[0];
}

/** Families of every defined name (`color`, `space`, ...). */
export function paletteFamilies(defined) {
  return new Set([...defined].map(familyOf));
}

/**
 * Body of every `var(...)` in `source`, balanced over nested parentheses, so
 * `var(--a, var(--b, oklch(1 0 0)))` yields both the outer and the inner body.
 */
export function varBodies(source) {
  const bodies = [];
  let start = source.indexOf('var(');
  while (start !== -1) {
    let depth = 0;
    let end = start + 3;
    for (; end < source.length; end++) {
      if (source[end] === '(') {
        depth++;
      } else if (source[end] === ')') {
        depth--;
        if (depth === 0) {
          break;
        }
      }
    }
    bodies.push(source.slice(start + 4, end));
    start = source.indexOf('var(', start + 4);
  }
  return bodies;
}

/** Splits a `var()` body into its property name and its fallback (or null). */
export function splitVarBody(body) {
  const comma = body.indexOf(',');
  if (comma === -1) {
    return { name: body.trim(), fallback: null };
  }
  return { name: body.slice(0, comma).trim(), fallback: body.slice(comma + 1).trim() };
}

/** Rule A: undefined palette-family reads in one stylesheet, deduplicated. */
export function undefinedPaletteReads(source, defined, families) {
  const found = new Set();
  for (const body of varBodies(source)) {
    const { name } = splitVarBody(body);
    if (!name.startsWith('--cngx-') || defined.has(name) || !families.has(familyOf(name))) {
      continue;
    }
    found.add(name);
  }
  return [...found];
}

const SENTINELS = new Set(['transparent', 'none', '0', '0px', 'initial']);

/** Every `@property` whose `initial-value` is a sentinel. */
export function sentinelRegistrations(source) {
  const names = new Set();
  for (const m of source.matchAll(/@property\s+(--[a-z0-9-]+)\s*\{([^}]*)\}/gi)) {
    const initial = /initial-value\s*:\s*([^;]+)/i.exec(m[2]);
    if (initial && SENTINELS.has(initial[1].trim().toLowerCase())) {
      names.add(m[1]);
    }
  }
  return names;
}

/** Rule B: `var(--p, real-fallback)` reads of a sentinel-registered `--p`. */
export function deadSentinelFallbacks(source, sentinels) {
  const found = new Set();
  for (const body of varBodies(source)) {
    const { name, fallback } = splitVarBody(body);
    if (!sentinels.has(name) || fallback === null) {
      continue;
    }
    const value = fallback.toLowerCase();
    if (value === '' || value === 'inherit' || SENTINELS.has(value)) {
      continue;
    }
    found.add(name);
  }
  return [...found];
}

// --- repo scan ---------------------------------------------------------------

function walkCss(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules') {
      continue;
    }
    const full = resolve(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walkCss(full));
    } else if (entry.endsWith('.css')) {
      out.push(full);
    }
  }
  return out;
}

function read(full) {
  return {
    rel: relative(REPO_ROOT, full).replaceAll('\\', '/'),
    source: stripComments(readFileSync(full, 'utf8')),
  };
}

const ALL_CSS = walkCss(PROJECTS).map(read);
const SCANNED = ALL_CSS.filter(
  ({ rel }) =>
    !rel.startsWith('projects/themes/') &&
    !rel.includes('.spec-host.') &&
    !rel.includes('/examples/'),
);

const DEFINED = new Set();
for (const full of walkCss(THEMING)) {
  for (const name of definedProperties(read(full).source)) {
    DEFINED.add(name);
  }
}
const FAMILIES = paletteFamilies(DEFINED);

const SENTINEL_PROPERTIES = new Set();
for (const { source } of ALL_CSS) {
  for (const name of sentinelRegistrations(source)) {
    SENTINEL_PROPERTIES.add(name);
  }
}

function repoOffenders() {
  const rows = [];
  for (const { rel, source } of SCANNED) {
    for (const token of undefinedPaletteReads(source, DEFINED, FAMILIES)) {
      rows.push({ rule: 'A', token, file: rel });
    }
    for (const token of deadSentinelFallbacks(source, SENTINEL_PROPERTIES)) {
      rows.push({ rule: 'B', token, file: rel });
    }
  }
  return rows;
}

const key = ({ rule, token, file }) => `${rule} ${token} ${file}`;

// --- allowlist ---------------------------------------------------------------

const ALLOWLIST = [
  {
    rule: 'A',
    token: '--cngx-color-focus',
    file: 'projects/ui/command-palette/palette/command-palette.component.css',
    reason: 'out of feature area, follow-up (button family roadmap, outside-roadmap list)',
  },
  {
    rule: 'A',
    token: '--cngx-color-focus',
    file: 'projects/ui/command-palette/panel/command-panel.component.css',
    reason: 'out of feature area, follow-up (button family roadmap, outside-roadmap list)',
  },
  {
    rule: 'A',
    token: '--cngx-color-muted',
    file: 'projects/common/display/avatar-group/avatar-group.css',
    reason: 'out of feature area, follow-up (button family roadmap, outside-roadmap list)',
  },
  {
    rule: 'A',
    token: '--cngx-color-muted',
    file: 'projects/ui/command-palette/palette/command-palette.component.css',
    reason: 'out of feature area, follow-up (button family roadmap, outside-roadmap list)',
  },
  {
    rule: 'A',
    token: '--cngx-color-muted',
    file: 'projects/ui/command-palette/panel/command-panel.component.css',
    reason: 'out of feature area, follow-up (button family roadmap, outside-roadmap list)',
  },
  {
    rule: 'A',
    token: '--cngx-color-muted-foreground',
    file: 'projects/ui/command-palette/palette/command-palette.component.css',
    reason: 'out of feature area, follow-up (button family roadmap, outside-roadmap list)',
  },
  {
    rule: 'A',
    token: '--cngx-color-muted-foreground',
    file: 'projects/ui/command-palette/panel/command-panel.component.css',
    reason: 'out of feature area, follow-up (button family roadmap, outside-roadmap list)',
  },
  {
    rule: 'A',
    token: '--cngx-color-on-danger',
    file: 'projects/ui/stepper/dot-stepper.component.css',
    reason:
      'undefined in the default palette, solid fill below 4.5:1; owner decision 2026-11-03 limits the fix to the button, follow-up',
  },
  {
    rule: 'A',
    token: '--cngx-color-on-danger',
    file: 'projects/ui/stepper/stepper.component.css',
    reason:
      'undefined in the default palette, solid fill below 4.5:1; owner decision 2026-11-03 limits the fix to the button, follow-up',
  },
  {
    rule: 'A',
    token: '--cngx-color-on-primary',
    file: 'projects/common/data/paginate/styles/paginator-base.css',
    reason:
      'undefined in the default palette, solid fill below 4.5:1; owner decision 2026-11-03 limits the fix to the button, follow-up',
  },
  {
    rule: 'A',
    token: '--cngx-color-on-primary',
    file: 'projects/common/interactive/slider/range-slider.component.css',
    reason:
      'undefined in the default palette, solid fill below 4.5:1; owner decision 2026-11-03 limits the fix to the button, follow-up',
  },
  {
    rule: 'A',
    token: '--cngx-color-on-primary',
    file: 'projects/common/interactive/slider/slider.component.css',
    reason:
      'undefined in the default palette, solid fill below 4.5:1; owner decision 2026-11-03 limits the fix to the button, follow-up',
  },
  {
    rule: 'A',
    token: '--cngx-color-on-primary',
    file: 'projects/common/theming/components/cngx-button-toggle.css',
    reason:
      'undefined in the default palette, solid fill below 4.5:1; owner decision 2026-11-03 limits the fix to the button, follow-up',
  },
  {
    rule: 'A',
    token: '--cngx-color-on-primary',
    file: 'projects/ui/accordion/accordion-skins.css',
    reason:
      'undefined in the default palette, solid fill below 4.5:1; owner decision 2026-11-03 limits the fix to the button, follow-up',
  },
  {
    rule: 'A',
    token: '--cngx-color-on-primary',
    file: 'projects/ui/breadcrumb/breadcrumb-bar.component.css',
    reason:
      'undefined in the default palette, solid fill below 4.5:1; owner decision 2026-11-03 limits the fix to the button, follow-up',
  },
  {
    rule: 'A',
    token: '--cngx-color-on-primary',
    file: 'projects/ui/data-grid-accordion/data-grid-accordion-skins.css',
    reason:
      'undefined in the default palette, solid fill below 4.5:1; owner decision 2026-11-03 limits the fix to the button, follow-up',
  },
  {
    rule: 'A',
    token: '--cngx-color-on-primary',
    file: 'projects/ui/paginator/paginator.component.css',
    reason:
      'undefined in the default palette, solid fill below 4.5:1; owner decision 2026-11-03 limits the fix to the button, follow-up',
  },
  {
    rule: 'A',
    token: '--cngx-color-on-primary',
    file: 'projects/ui/tabs/tab-group.component.css',
    reason:
      'undefined in the default palette, solid fill below 4.5:1; owner decision 2026-11-03 limits the fix to the button, follow-up',
  },
  {
    rule: 'A',
    token: '--cngx-color-on-primary',
    file: 'projects/ui/tabs/tab-nav.component.css',
    reason:
      'undefined in the default palette, solid fill below 4.5:1; owner decision 2026-11-03 limits the fix to the button, follow-up',
  },
  {
    rule: 'A',
    token: '--cngx-color-surface-alt',
    file: 'projects/ui/accordion/accordion-skins.css',
    reason: 'out of feature area, follow-up (button family roadmap, outside-roadmap list)',
  },
  {
    rule: 'A',
    token: '--cngx-font-base',
    file: 'projects/core/theming/text-scale-tokens.css',
    reason:
      'documented consumer hook for a bespoke base size; the 100% fallback is the default by design',
  },
  {
    rule: 'A',
    token: '--cngx-font-family-mono',
    file: 'projects/ui/breadcrumb/breadcrumb-bar.component.css',
    reason: 'out of feature area, follow-up (button family roadmap, outside-roadmap list)',
  },
  {
    rule: 'A',
    token: '--cngx-font-mono',
    file: 'projects/ui/data-grid-accordion/data-grid-accordion-skins.css',
    reason: 'out of feature area, follow-up (button family roadmap, outside-roadmap list)',
  },
  {
    rule: 'A',
    token: '--cngx-radius-xs',
    file: 'projects/ui/command-palette/palette/command-palette.component.css',
    reason: 'out of feature area, follow-up (button family roadmap, outside-roadmap list)',
  },
  {
    rule: 'A',
    token: '--cngx-space-2xs',
    file: 'projects/forms/filter-builder/filter-builder.component.css',
    reason: 'out of feature area, follow-up (button family roadmap, outside-roadmap list)',
  },
  {
    rule: 'B',
    token: '--cngx-paginator-current-border-color',
    file: 'projects/common/data/paginate/styles/paginator-base.css',
    reason:
      'ui/paginator SETS the property on its host, so the fallback only matters for a bare common paginator, where transparent paints; out of feature area, follow-up',
  },
  {
    rule: 'B',
    token: '--cngx-tab-overflow-bg',
    file: 'projects/ui/tabs/tab-overflow.component.css',
    reason:
      'the mat-tabs bridge SETS the property; without it transparent paints instead of the strip background; out of feature area, follow-up',
  },
];

// --- the suite ---------------------------------------------------------------

describe('Rule A - undefined palette reads', () => {
  const defined = new Set(['--cngx-color-primary', '--cngx-space-md']);
  const families = paletteFamilies(defined);

  it('flags a palette-family read the palette does not define', () => {
    const found = undefinedPaletteReads(
      '.a { color: var(--cngx-color-on-primary, oklch(1 0 0)); }',
      defined,
      families,
    );
    expect(found).toEqual(['--cngx-color-on-primary']);
  });

  it('passes defined palette reads and non-palette component tokens', () => {
    const found = undefinedPaletteReads(
      '.a { color: var(--cngx-color-primary); gap: var(--cngx-space-md); --x: var(--cngx-button-tone, var(--cngx-color-primary)); }',
      defined,
      families,
    );
    expect(found).toEqual([]);
  });
});

describe('Rule B - dead fallback on a sentinel registration', () => {
  const sentinels = sentinelRegistrations(`
    @property --p { syntax: '<color>'; inherits: true; initial-value: transparent; }
    @property --q { syntax: '<color>'; inherits: true; initial-value: red; }
  `);

  it('collects only sentinel registrations', () => {
    expect([...sentinels]).toEqual(['--p']);
  });

  it('flags a real fallback on a sentinel-registered property', () => {
    expect(
      deadSentinelFallbacks('.a { color: var(--p, oklch(0.66 0.19 50)); }', sentinels),
    ).toEqual(['--p']);
  });

  it('passes a sentinel or inherit fallback and a bare read', () => {
    expect(
      deadSentinelFallbacks(
        '.a { color: var(--p, transparent); b: var(--p, inherit); c: var(--p); d: var(--q, blue); }',
        sentinels,
      ),
    ).toEqual([]);
  });

  it('reads nested var() bodies with balanced parentheses', () => {
    expect(varBodies('var(--a, var(--p, oklch(1 0 0)))')).toEqual([
      '--a, var(--p, oklch(1 0 0))',
      '--p, oklch(1 0 0)',
    ]);
  });
});

describe('repo-wide token definition ratchet', () => {
  const offenders = repoOffenders().map(key).sort();
  const allowed = ALLOWLIST.map(key).sort();

  it('derives the palette families from projects/core/theming', () => {
    expect(FAMILIES.has('color')).toBe(true);
    expect(FAMILIES.has('space')).toBe(true);
  });

  it('every allowlist row carries a reason', () => {
    expect(ALLOWLIST.filter((row) => !row.reason || row.reason.trim() === '')).toEqual([]);
  });

  it('no offender outside the allowlist', () => {
    expect(offenders.filter((row) => !allowed.includes(row))).toEqual([]);
  });

  it('no stale allowlist row', () => {
    expect(allowed.filter((row) => !offenders.includes(row))).toEqual([]);
  });
});
