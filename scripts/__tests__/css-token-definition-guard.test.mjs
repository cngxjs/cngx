import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, posix, relative, resolve } from 'node:path';

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
 * Rule B - dead fallback on a registered property. A property registered via
 * `@property` always resolves, so `var(--p, fallback)` never uses its fallback.
 * In `projects/core/**` every fallback that differs from the registered
 * `initial-value` is a hit (compared after folding case, whitespace and `0` vs
 * `0px`). Elsewhere only a sentinel registration (`transparent`, `none`, `0`,
 * `initial`) with a real fallback is a hit: there the author meant the fallback
 * but the sentinel paints (owner decision 2026-11-13 keeps the general form to
 * core). Static stand-in for "never set on an ancestor rule": the guard cannot
 * see the runtime cascade, so a row whose property IS set by an ancestor
 * component is allowlisted with that reason. A fallback equal to the initial or
 * `inherit` passes, and so does a sentinel fallback on a sentinel registration.
 *
 * Rules C to E cover every scanned component stylesheet. Rule C - a
 * `--mat-sys-*` read: Material system tokens belong to the theme bridges in
 * `projects/themes/**`. Rule D - a bare hex colour: a colour is a token read
 * with a fallback. A hex literal as a `var()` fallback is the documented
 * convention and an `@property` `initial-value` must be a literal, so both
 * pass; anywhere else a hex is flagged. `projects/forms/**` keeps the stricter
 * rule and flags every hex literal. Rule E - a `var()` with no fallback on a
 * token the default palette does not define: unset, the declaration computes
 * to its initial value, so the read needs a fallback or a stated reason. A
 * property registered by an `@property` rule counts as defined when the
 * registration is in the same stylesheet or in one `projects/themes/cngx.css`
 * imports: then it is loaded wherever the read is and resolves, at worst to its
 * registered initial. A registration in another component's sheet applies only
 * once that sheet is loaded, so a read relying on it carries a reason row.
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

const SENTINELS = new Set(['transparent', 'none', '0', 'initial']);

/** Case, whitespace and a zero length (`0px`, `0rem`, `0em`) folded, so equal values compare equal. */
export function normalizeValue(value) {
  const folded = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*([(),/])\s*/g, '$1');
  return /^0(px|rem|em)?$/.test(folded) ? '0' : folded;
}

/** Every `@property` name mapped to its normalized `initial-value`s (a name may be registered twice). */
export function registrations(source, into = new Map()) {
  for (const m of source.matchAll(/@property\s+(--[a-z0-9-]+)\s*\{([^}]*)\}/gi)) {
    const initial = /initial-value\s*:\s*([^;]+)/i.exec(m[2]);
    if (!initial) {
      continue;
    }
    const values = into.get(m[1]) ?? new Set();
    values.add(normalizeValue(initial[1]));
    into.set(m[1], values);
  }
  return into;
}

/**
 * Rule B: `var(--p, fallback)` reads of a registered `--p` whose fallback can
 * never paint. By default only a sentinel registration with a real fallback
 * counts; with `anyInitial` every fallback that differs from the registered
 * initial counts.
 */
export function deadFallbacks(source, registered, { anyInitial = false } = {}) {
  const found = new Set();
  for (const body of varBodies(source)) {
    const { name, fallback } = splitVarBody(body);
    const initials = registered.get(name);
    if (!initials || fallback === null) {
      continue;
    }
    const value = normalizeValue(fallback);
    if (value === '' || value === 'inherit' || initials.has(value)) {
      continue;
    }
    const sentinelInitial = [...initials].some((initial) => SENTINELS.has(initial));
    if (anyInitial || (sentinelInitial && !SENTINELS.has(value))) {
      found.add(name);
    }
  }
  return [...found];
}

/** Rule C: every `--mat-sys-*` name read or set in one stylesheet. */
export function materialSystemReads(source) {
  return [...new Set([...source.matchAll(/--mat-sys-[a-z0-9-]+/g)].map((m) => m[0]))];
}

/** Rule D: every raw hex colour literal in one stylesheet. */
export function rawHexColours(source) {
  return [
    ...new Set([...source.matchAll(/#[0-9a-f]{3,8}(?![\w-])/gi)].map((m) => m[0].toLowerCase())),
  ];
}

/**
 * Rule D outside `projects/forms/**`: hex literals left after every
 * `@property` block and every `var()` call is removed, so a hex fallback and a
 * registered `initial-value` pass.
 */
export function bareHexColours(source) {
  let rest = source.replace(/@property\s+--[\w-]+\s*\{[^}]*\}/g, ' ');
  for (const body of varBodies(rest)) {
    rest = rest.replace(`var(${body})`, ' ');
  }
  return rawHexColours(rest);
}

/** Every custom property registered by an `@property` rule in `source`. */
export function registeredProperties(source) {
  return new Set([...source.matchAll(/@property\s+(--[\w-]+)/g)].map((m) => m[1]));
}

/**
 * Rule E: `var()` reads with no fallback of a name that neither the palette,
 * the stylesheet itself (a private `--_*` token set in the same file passes)
 * nor an `@property` registration defines.
 */
export function undefinedReadsWithoutFallback(source, defined, registered = new Set()) {
  const local = new Set([...source.matchAll(/(?<![\w-])(--[\w-]+)\s*:/g)].map((m) => m[1]));
  const found = new Set();
  for (const body of varBodies(source)) {
    const { name, fallback } = splitVarBody(body);
    if (fallback === null && !defined.has(name) && !local.has(name) && !registered.has(name)) {
      found.add(name);
    }
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

const REGISTERED = new Map();
for (const { source } of ALL_CSS) {
  registrations(source, REGISTERED);
}

/** Stylesheets `projects/themes/cngx.css` imports, so every cngx app loads. */
export function bundledSheets(bundleSource, bundleRel) {
  const dir = posix.dirname(bundleRel);
  return new Set(
    [...bundleSource.matchAll(/@import\s+['"](\.[^'"]+\.css)['"]/g)].map((m) =>
      posix.join(dir, m[1]),
    ),
  );
}

const BUNDLE_REL = 'projects/themes/cngx.css';
const BUNDLED = bundledSheets(
  stripComments(readFileSync(resolve(REPO_ROOT, BUNDLE_REL), 'utf8')),
  BUNDLE_REL,
);

const BUNDLED_REGISTRATIONS = new Set();
for (const { rel, source } of ALL_CSS) {
  if (!BUNDLED.has(rel)) {
    continue;
  }
  for (const name of registeredProperties(source)) {
    BUNDLED_REGISTRATIONS.add(name);
  }
}

function repoOffenders(files = SCANNED) {
  const rows = [];
  for (const { rel, source } of files) {
    for (const token of undefinedPaletteReads(source, DEFINED, FAMILIES)) {
      rows.push({ rule: 'A', token, file: rel });
    }
    const anyInitial = rel.startsWith('projects/core/');
    for (const token of deadFallbacks(source, REGISTERED, { anyInitial })) {
      rows.push({ rule: 'B', token, file: rel });
    }
    for (const token of materialSystemReads(source)) {
      rows.push({ rule: 'C', token, file: rel });
    }
    const hex = rel.startsWith('projects/forms/') ? rawHexColours(source) : bareHexColours(source);
    for (const token of hex) {
      rows.push({ rule: 'D', token, file: rel });
    }
    const registered = new Set([...BUNDLED_REGISTRATIONS, ...registeredProperties(source)]);
    for (const token of undefinedReadsWithoutFallback(source, DEFINED, registered)) {
      rows.push({ rule: 'E', token, file: rel });
    }
  }
  return rows;
}

const key = ({ rule, token, file }) => `${rule} ${token} ${file}`;

// --- allowlist ---------------------------------------------------------------

const RIPPLE_INLINE =
  'set per wave as an inline style by CngxRipple (ripple.directive.ts), so no stylesheet defines it';

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
  {
    rule: 'E',
    token: '--cngx-field-bare-inline-size',
    file: 'projects/forms/select/shared/select-base.css',
    reason:
      'no fallback by design: unset, inline-size computes to auto and a bare select keeps its content width (pinned in select-base.css.spec.ts)',
  },
  {
    rule: 'E',
    token: '--cngx-icon-button-size',
    file: 'projects/common/button/close-button.component.css',
    reason:
      'SET by icon-button.component.css, which CngxCloseButton loads through styleUrls before this sheet',
  },
  {
    rule: 'E',
    token: '--cngx-tab-active-color',
    file: 'projects/ui/tabs/tab-group.component.css',
    reason:
      'registered by common/tabs/styles/tabs-base.css, which CngxTabGroup loads through styleUrls before this sheet',
  },
  {
    rule: 'E',
    token: '--cngx-tab-color',
    file: 'projects/ui/tabs/tab-overflow.component.css',
    reason:
      'registered by common/tabs/styles/tabs-base.css; cngx-tab-overflow renders only projected into cngx-tab-group, which loads that sheet',
  },
  {
    rule: 'E',
    token: '--cngx-ripple-size',
    file: 'projects/common/theming/components/cngx-ripple.css',
    reason: RIPPLE_INLINE,
  },
  {
    rule: 'E',
    token: '--cngx-ripple-x',
    file: 'projects/common/theming/components/cngx-ripple.css',
    reason: RIPPLE_INLINE,
  },
  {
    rule: 'E',
    token: '--cngx-ripple-y',
    file: 'projects/common/theming/components/cngx-ripple.css',
    reason: RIPPLE_INLINE,
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

describe('Rule B - dead fallback on a registered property', () => {
  const registered = registrations(`
    @property --p { syntax: '<color>'; inherits: true; initial-value: transparent; }
    @property --q { syntax: '<color>'; inherits: true; initial-value: red; }
    @property --g { syntax: '<length>'; inherits: false; initial-value: 4px; }
    @property --z { syntax: '<length>'; inherits: false; initial-value: 0px; }
  `);

  it('collects every registration with its normalized initial value', () => {
    expect([...registered.keys()]).toEqual(['--p', '--q', '--g', '--z']);
    expect([...registered.get('--z')]).toEqual(['0']);
  });

  it('flags a real fallback on a sentinel-registered property', () => {
    expect(deadFallbacks('.a { color: var(--p, oklch(0.66 0.19 50)); }', registered)).toEqual([
      '--p',
    ]);
  });

  it('passes a sentinel or inherit fallback, a bare read and a non-sentinel registration', () => {
    expect(
      deadFallbacks(
        '.a { color: var(--p, transparent); b: var(--p, inherit); c: var(--p); d: var(--q, blue); }',
        registered,
      ),
    ).toEqual([]);
  });

  it('with anyInitial flags every fallback that differs from the initial', () => {
    expect(
      deadFallbacks('.a { gap: var(--g, 8px); color: var(--q, blue); }', registered, {
        anyInitial: true,
      }),
    ).toEqual(['--g', '--q']);
  });

  it('with anyInitial passes a fallback equal to the initial after normalization', () => {
    expect(
      deadFallbacks(
        '.a { gap: var(--g, 4PX); b: var(--z, 0); c: var(--q, RED); d: var(--p, inherit); }',
        registered,
        { anyInitial: true },
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

describe('Rules C to E - component stylesheets', () => {
  it('Rule C flags a Material system token read', () => {
    expect(materialSystemReads('.a { color: var(--mat-sys-primary, currentColor); }')).toEqual([
      '--mat-sys-primary',
    ]);
  });

  it('Rules C and D run on a stylesheet outside projects/forms, forms keeps the any-hex D', () => {
    const source = '.a { color: var(--mat-sys-primary, #fff); }';
    expect(repoOffenders([{ rel: 'projects/ui/x/x.css', source }]).map(key)).toEqual([
      'C --mat-sys-primary projects/ui/x/x.css',
    ]);
    expect(repoOffenders([{ rel: 'projects/forms/x/x.css', source }]).map(key)).toEqual([
      'C --mat-sys-primary projects/forms/x/x.css',
      'D #fff projects/forms/x/x.css',
    ]);
  });

  it('Rule D flags a raw hex colour and passes ids and token names', () => {
    expect(rawHexColours('.a { color: #FF0000; b: #abc; } #main { --x-1abc: 0; }')).toEqual([
      '#ff0000',
      '#abc',
    ]);
  });

  it('bare Rule D flags a hex outside a var() fallback and an @property initial-value', () => {
    expect(bareHexColours('.a { color: #ff00aa; }')).toEqual(['#ff00aa']);
    expect(
      bareHexColours(`
        @property --cngx-a-border { syntax: '<color>'; inherits: true; initial-value: #e0e0e0; }
        .a { color: var(--x, #fff); border-color: var(--y, var(--z, #abcdef)); }
      `),
    ).toEqual([]);
  });

  it('collects the stylesheets the cngx.css bundle imports', () => {
    expect([
      ...bundledSheets(
        "@import '../core/theming/layers.css'; @import '@cngx/x/y.css'; @import '../common/a/b.css';",
        'projects/themes/cngx.css',
      ),
    ]).toEqual(['projects/core/theming/layers.css', 'projects/common/a/b.css']);
    expect(BUNDLED.has('projects/core/theming/system-tokens.css')).toBe(true);
  });

  it('Rule E counts a registration in the same sheet, not one in an unbundled other sheet', () => {
    const own =
      "@property --cngx-zz-own { syntax: '*'; inherits: true; initial-value: 0; } .a { b: var(--cngx-zz-own); }";
    const borrowed = '.a { b: var(--cngx-zz-own); }';
    expect(repoOffenders([{ rel: 'projects/ui/x/own.css', source: own }])).toEqual([]);
    expect(
      repoOffenders([{ rel: 'projects/ui/x/borrowed.css', source: borrowed }]).map(key),
    ).toEqual(['E --cngx-zz-own projects/ui/x/borrowed.css']);
  });

  it('Rule E passes a bare read of a registered property', () => {
    const registered = registeredProperties(
      "@property --cngx-a-layer { syntax: '<color>'; inherits: true; initial-value: transparent; }",
    );
    expect(
      undefinedReadsWithoutFallback('.a { color: var(--cngx-a-layer); }', new Set(), registered),
    ).toEqual([]);
    expect(undefinedReadsWithoutFallback('.a { color: var(--cngx-a-layer); }', new Set())).toEqual([
      '--cngx-a-layer',
    ]);
  });

  it('Rule E flags a bare read of an undefined name and passes palette reads and fallbacks', () => {
    const defined = new Set(['--cngx-color-primary']);
    expect(
      undefinedReadsWithoutFallback(
        '.a { --_w: 1px; a: var(--cngx-review-probe); b: var(--cngx-color-primary); c: var(--cngx-x, 1px); d: var(--_w); }',
        defined,
      ),
    ).toEqual(['--cngx-review-probe']);
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
