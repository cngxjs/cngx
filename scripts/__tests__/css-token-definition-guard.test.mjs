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
 * Rules C to E cover every scanned component stylesheet, `.css` and `.scss`
 * (a `.scss` sheet loses its `//` line comments first). Rule C - a
 * `--mat-sys-*` read: Material system tokens belong to the theme bridges in
 * `projects/themes/**`. Rule D - a bare colour: a colour is a token read with a
 * fallback. Hex literals, `rgb()` / `rgba()` / `hsl()` / `hsla()` and CSS
 * named colours in a declaration value are flagged; system colours
 * (`Canvas`, ...), `transparent` and `currentColor` are not named colours. A
 * colour as a `var()` fallback is the documented convention and an
 * `@property` `initial-value` must be a literal, so both pass. A functional
 * colour is reported by its function name (`rgb()`). `projects/forms/**`
 * keeps the stricter hex rule and flags every hex literal. Rule E - a `var()` with no fallback on a
 * token the default palette does not define: unset, the declaration computes
 * to its initial value, so the read needs a fallback or a stated reason. A
 * property registered by an `@property` rule counts as defined when the
 * registration is in the same stylesheet or in one `projects/themes/cngx.css`
 * imports: then it is loaded wherever the read is and resolves, at worst to its
 * registered initial. A registration in another component's sheet applies only
 * once that sheet is loaded, so a read relying on it carries a reason row.
 *
 * Rule F - a translucent primary literal. `oklch(0.66 0.19 50 / a)` and
 * `oklch(0.72 0.18 50 / a)` are the Ember primary at a fixed alpha: a tint
 * written that way stays orange under a brand primary, a theme bridge or a
 * re-themed scheme island. A tint is `color-mix(in oklch,
 * var(--cngx-color-primary, ...) N%, transparent)`. The only place the
 * literal may stay is an `@property` `initial-value`, which must be
 * computationally independent. The opaque `var(--cngx-color-primary,
 * oklch(0.66 0.19 50))` fallback passes. Rule F has no allowlist rows.
 *
 * Rule G - an Ember initial on a token cngx never assigns. The registration-side
 * twin of Rule B: an `@property` whose `initial-value` holds the opaque Ember
 * primary (`oklch(0.66 0.19 50)`, `oklch(0.72 0.18 50)`, alone or inside a
 * shorthand such as `2px solid oklch(...)`) always resolves to that literal, so
 * every use-site `var(--cngx-color-primary, ...)` fallback is dead and the
 * surface stays orange under any brand primary. Unless a scanned stylesheet
 * assigns the property (`--p: ...` outside comments and strings), the
 * registration is a hit. A Material bridge assignment in `projects/themes/**`
 * does not count: the default theme must not depend on a bridge. Rule G has no
 * allowlist rows.
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

/** `source` with every `var(` lower-cased: CSS function names are case-insensitive. */
function foldVarCase(source) {
  return source.replace(/var\(/gi, 'var(');
}

/** `source` without its quoted strings, so `content: "--x: y"` is no declaration. */
function withoutStrings(source) {
  return source.replace(/(["'])(?:\\.|(?!\1).)*\1/g, ' ');
}

/**
 * `source` with every CSS escape resolved: `\2d` and `\-` both read as `-`, so
 * an escaped name cannot hide from a name match.
 */
export function unescapeCss(source) {
  return source.replace(/\\(?:([0-9a-f]{1,6})\s?|(.))/gi, (_, hex, ch) =>
    hex ? String.fromCodePoint(parseInt(hex, 16)) : ch,
  );
}

/**
 * Body of every `var(...)` in `source`, any case, balanced over nested
 * parentheses, so `var(--a, var(--b, oklch(1 0 0)))` yields both the outer and
 * the inner body.
 */
export function varBodies(raw) {
  const source = foldVarCase(raw);
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
  return [...new Set([...unescapeCss(source).matchAll(/--mat-sys-[a-z0-9-]+/g)].map((m) => m[0]))];
}

/** Rule D: every raw hex colour literal in one stylesheet. */
export function rawHexColours(source) {
  return [
    ...new Set([...source.matchAll(/#[0-9a-f]{3,8}(?![\w-])/gi)].map((m) => m[0].toLowerCase())),
  ];
}

/** The CSS named colours (CSS Color 4), without `transparent` and `currentColor`. */
const NAMED_COLOURS = new Set(
  (
    'aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue ' +
    'blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk ' +
    'crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki ' +
    'darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen ' +
    'darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue ' +
    'dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite ' +
    'gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki ' +
    'lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan ' +
    'lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen ' +
    'lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen ' +
    'magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen ' +
    'mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream ' +
    'mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid ' +
    'palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum ' +
    'powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown ' +
    'seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen ' +
    'steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen'
  ).split(' '),
);

/** `source` without every `@property` block and every `var()` call. */
function withoutRegistrationsAndVars(source) {
  let rest = foldVarCase(source).replace(/@property\s+--[\w-]+\s*\{[^}]*\}/g, ' ');
  for (const body of varBodies(rest)) {
    rest = rest.replace(`var(${body})`, ' ');
  }
  return rest;
}

/** Every value of a `property: value` declaration in `source`, quoted strings removed. */
function declarationValues(source) {
  return [...source.matchAll(/(?<![\w-])-{0,2}[a-z][\w-]*\s*:\s*([^;{}]+)(?=[;}])/gi)].map((m) =>
    withoutStrings(m[1]),
  );
}

/** Functional and named colours in `source`: `rgb()`, `hsla()`, `red`, ... */
function functionalAndNamedColours(source) {
  const found = new Set();
  for (const m of source.matchAll(/(?<![\w-])(rgba?|hsla?)\(/gi)) {
    found.add(`${m[1].toLowerCase()}()`);
  }
  for (const value of declarationValues(source)) {
    for (const m of value.matchAll(/(?<![\w$.#-])([a-z]+)(?![\w(-])/gi)) {
      const word = m[1].toLowerCase();
      if (NAMED_COLOURS.has(word)) {
        found.add(word);
      }
    }
  }
  return [...found];
}

/**
 * Rule D outside `projects/forms/**`: hex literals, functional colours and
 * named colours left after every `@property` block and every `var()` call is
 * removed, so a colour fallback and a registered `initial-value` pass.
 */
export function bareColours(source) {
  const rest = withoutRegistrationsAndVars(source);
  return [...rawHexColours(rest), ...functionalAndNamedColours(rest)];
}

/** Rule D in `projects/forms/**`: every hex literal, plus the bare functional and named colours. */
export function strictColours(source) {
  return [
    ...rawHexColours(source),
    ...functionalAndNamedColours(withoutRegistrationsAndVars(source)),
  ];
}

/** The Ember primary up to its hue: light `oklch(0.66 0.19 50` and dark `oklch(0.72 0.18 50`. */
const EMBER_PRIMARY_CORE = String.raw`oklch\(\s*0\.(?:66\s+0\.19|72\s+0\.18)\s+50`;
const TRANSLUCENT_PRIMARY = new RegExp(`${EMBER_PRIMARY_CORE}\\s*\\/[^)]*\\)`, 'gi');
const EMBER_PRIMARY = new RegExp(`${EMBER_PRIMARY_CORE}(?![\\d.])`, 'i');

/**
 * Rule F: every translucent Ember primary literal that is not the value of an
 * `initial-value:` declaration, whitespace folded.
 */
export function translucentPrimaryLiterals(source) {
  const rest = source.replace(/initial-value\s*:[^;}]*/gi, ' ');
  return [...rest.matchAll(TRANSLUCENT_PRIMARY)].map((m) => m[0].replace(/\s+/g, ' '));
}

/**
 * Rule G input: every `@property` name whose raw `initial-value` holds the Ember
 * primary, opaque or translucent, alone or inside a shorthand.
 */
export function emberInitialRegistrations(source) {
  const names = new Set();
  for (const m of source.matchAll(/@property\s+(--[\w-]+)\s*\{([^}]*)\}/gi)) {
    const initial = /initial-value\s*:\s*([^;]+)/i.exec(m[2]);
    if (initial && EMBER_PRIMARY.test(initial[1])) {
      names.add(m[1]);
    }
  }
  return [...names];
}

/** Every custom property assigned by a `--p:` declaration in `source`, quoted strings removed. */
export function assignedProperties(source) {
  return new Set(
    [...withoutStrings(source).matchAll(/(?<![\w-])(--[\w-]+)\s*:/g)].map((m) => m[1]),
  );
}

/**
 * Rule G: every `{ token, file }` whose Ember-initial registration in `file`
 * (from `registrationsByFile`, file to names) no name in `assigned` covers.
 */
export function unassignedEmberInitials(registrationsByFile, assigned) {
  const rows = [];
  for (const [file, names] of registrationsByFile) {
    for (const token of names) {
      if (!assigned.has(token)) {
        rows.push({ token, file });
      }
    }
  }
  return rows;
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
  const local = assignedProperties(source);
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

/**
 * `source` without its `//` line comments, for a `.scss` sheet. A `//` inside
 * `url()` or a quoted string is content, not a comment.
 */
export function stripLineComments(source) {
  let out = '';
  let quote = null;
  let urlDepth = 0;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      out += ch;
      if (ch === '\\') {
        out += source[++i] ?? '';
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (/url\($/i.test(source.slice(Math.max(0, i - 3), i + 1))) {
      urlDepth = 1;
    } else if (urlDepth > 0 && ch === ')') {
      urlDepth = 0;
    } else if (urlDepth === 0 && ch === '/' && source[i + 1] === '/') {
      const eol = source.indexOf('\n', i);
      i = eol === -1 ? source.length : eol - 1;
      continue;
    }
    out += ch;
  }
  return out;
}

/** The scanned text of one stylesheet: block comments out, and `//` comments for `.scss`. */
export function scannedSource(rel, raw) {
  const source = stripComments(raw);
  return rel.endsWith('.scss') ? stripLineComments(source) : source;
}

function walkCss(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules') {
      continue;
    }
    const full = resolve(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walkCss(full));
    } else if (entry.endsWith('.css') || entry.endsWith('.scss')) {
      out.push(full);
    }
  }
  return out;
}

function read(full) {
  const rel = relative(REPO_ROOT, full).replaceAll('\\', '/');
  return { rel, source: scannedSource(rel, readFileSync(full, 'utf8')) };
}

/** A component stylesheet the guard reads: no theme bridge, example, spec host or fixture. */
function isScanned({ rel }) {
  return (
    !rel.startsWith('projects/themes/') &&
    !rel.includes('.spec-host.') &&
    !rel.includes('/examples/') &&
    !rel.includes('/testing/fixtures/')
  );
}

const ALL_CSS = walkCss(PROJECTS).map(read);
const SCANNED = ALL_CSS.filter(isScanned);

/** Every custom property a scanned stylesheet among `files` assigns. */
export function assignedAcross(files) {
  const names = new Set();
  for (const file of files.filter(isScanned)) {
    for (const name of assignedProperties(file.source)) {
      names.add(name);
    }
  }
  return names;
}

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

function repoOffenders(files = SCANNED, assigned = assignedAcross(files)) {
  const rows = [];
  const emberInitials = new Map();
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
    const colours = rel.startsWith('projects/forms/') ? strictColours(source) : bareColours(source);
    for (const token of colours) {
      rows.push({ rule: 'D', token, file: rel });
    }
    const registered = new Set([...BUNDLED_REGISTRATIONS, ...registeredProperties(source)]);
    for (const token of undefinedReadsWithoutFallback(source, DEFINED, registered)) {
      rows.push({ rule: 'E', token, file: rel });
    }
    for (const token of translucentPrimaryLiterals(source)) {
      rows.push({ rule: 'F', token, file: rel });
    }
    emberInitials.set(rel, emberInitialRegistrations(source));
  }
  for (const { token, file } of unassignedEmberInitials(emberInitials, assigned)) {
    rows.push({ rule: 'G', token, file });
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
    token: '--cngx-tab-overflow-bg',
    file: 'projects/ui/tabs/tab-overflow.component.css',
    reason:
      'the mat-tabs bridge SETS the property; without it transparent paints instead of the strip background; out of feature area, follow-up',
  },
  {
    rule: 'D',
    token: 'rgb()',
    file: 'projects/ui/data-grid-accordion/data-grid-accordion.component.css',
    reason: 'mask-image gradients: only the alpha channel is read, the colour never paints',
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
      'SET by cngx-button.css in the global cngx.css bundle, which paints every .cngx-icon-button before this sheet applies',
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
    expect(bareColours('.a { color: #ff00aa; }')).toEqual(['#ff00aa']);
    expect(
      bareColours(`
        @property --cngx-a-border { syntax: '<color>'; inherits: true; initial-value: #e0e0e0; }
        .a { color: var(--x, #fff); border-color: var(--y, var(--z, #abcdef)); }
      `),
    ).toEqual([]);
  });

  it('bare Rule D flags functional and named colours (probe t04)', () => {
    const source = '.a { color: rgb(255 0 170); background: red; }';
    expect(repoOffenders([{ rel: 'projects/ui/x/t04.css', source }]).map(key)).toEqual([
      'D rgb() projects/ui/x/t04.css',
      'D red projects/ui/x/t04.css',
    ]);
    expect(
      bareColours('.a { b: hsla(0 0% 0% / 0.5); c: rgba(0, 0, 0, 0.2); d: hsl(1 2% 3%); }'),
    ).toEqual(['hsla()', 'rgba()', 'hsl()']);
  });

  it('bare Rule D passes system colours, transparent, currentColor and a colour fallback', () => {
    expect(
      bareColours(`
        .a:hover { color: Canvas; background: transparent; border-color: currentColor; }
        .b { color: var(--x, rgb(0 0 0)); outline: 1px solid var(--y, red); }
        .c { transition: color 0.2s, background-color 0.2s; content: 'red'; }
        .d { grid-template-areas: "white black"; animation-name: var(--z, tan); }
      `),
    ).toEqual([]);
  });

  it('scans a .scss sheet without its line comments (probe t13)', () => {
    const raw = [
      '// a comment with #ffffff and --mat-sys-primary',
      '.a {',
      '  color: var(--mat-sys-tertiary, currentColor);',
      '  border-color: #123456; // trailing #abcdef',
      '  background: url(//cdn.example.com/x.png);',
      '}',
    ].join('\n');
    const rel = 'projects/ui/x/t13.scss';
    expect(repoOffenders([{ rel, source: scannedSource(rel, raw) }]).map(key)).toEqual([
      'C --mat-sys-tertiary projects/ui/x/t13.scss',
      'D #123456 projects/ui/x/t13.scss',
    ]);
    expect(scannedSource(rel, raw)).toContain('url(//cdn.example.com/x.png)');
    expect(scannedSource('projects/ui/x/t13.css', '.a { b: c; } // d')).toContain('// d');
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

  it('Rule C reads a Material system token through a CSS escape (probe t02)', () => {
    const source = '.t2 { color: var(--mat\\-sys-secondary, currentColor); }';
    expect(repoOffenders([{ rel: 'projects/ui/x/t02.css', source }]).map(key)).toEqual([
      'C --mat-sys-secondary projects/ui/x/t02.css',
    ]);
  });

  it('Rules C to E read an uppercase VAR() like var() (probe t07)', () => {
    const source =
      '.t7 { color: VAR(--cngx-zzprobe-e-two); border-color: VAR(--mat-sys-outline); outline-color: VAR(--x, red); }';
    expect(repoOffenders([{ rel: 'projects/ui/x/t07.css', source }]).map(key)).toEqual([
      'C --mat-sys-outline projects/ui/x/t07.css',
      'E --cngx-zzprobe-e-two projects/ui/x/t07.css',
      'E --mat-sys-outline projects/ui/x/t07.css',
    ]);
  });

  it('Rule E does not take a string literal for a local SET (probe t08)', () => {
    const source =
      '.t8::before { content: "--cngx-zzprobe-e-three: x"; } .t8 { color: var(--cngx-zzprobe-e-three); }';
    expect(repoOffenders([{ rel: 'projects/ui/x/t08.css', source }]).map(key)).toEqual([
      'E --cngx-zzprobe-e-three projects/ui/x/t08.css',
    ]);
  });
});

describe('Rule F - translucent primary literals', () => {
  it('flags an assignment and a use-site fallback', () => {
    const css = `:root { --x-bg: oklch(0.66 0.19 50 / 0.1); }
      .a { background: var(--x-bg, oklch(0.72  0.18 50 / 0.18)); }`;
    expect(translucentPrimaryLiterals(css)).toEqual([
      'oklch(0.66 0.19 50 / 0.1)',
      'oklch(0.72 0.18 50 / 0.18)',
    ]);
  });

  it('flags the literal in a .scss sheet but not in its line comments', () => {
    const scss = `// oklch(0.66 0.19 50 / 0.1) was the old tint
      .a { --x-bg: oklch(0.66 0.19 50 / 0.12); }`;
    expect(translucentPrimaryLiterals(scannedSource('projects/a/x.scss', scss))).toEqual([
      'oklch(0.66 0.19 50 / 0.12)',
    ]);
  });

  it('passes an initial-value, the opaque primary fallback and a derived tint', () => {
    const css = `@property --x-bg { syntax: '<color>'; inherits: true; initial-value: oklch(0.66 0.19 50 / 0.1); }
      .a { color: var(--cngx-color-primary, oklch(0.66 0.19 50)); }
      .b { background: color-mix(in oklch, var(--cngx-color-primary, oklch(0.72 0.18 50)) 18%, transparent); }`;
    expect(translucentPrimaryLiterals(css)).toEqual([]);
  });
});

describe('Rule G - Ember initial on an unassigned token', () => {
  const register = (name, initial) =>
    `@property ${name} { syntax: '*'; inherits: true; initial-value: ${initial}; }`;
  const rel = 'projects/ui/x/g.css';

  it('flags an exact Ember colour initial', () => {
    const source = register('--cngx-g-bg', 'oklch(0.66 0.19 50)');
    expect(repoOffenders([{ rel, source }]).map(key)).toEqual([`G --cngx-g-bg ${rel}`]);
  });

  it('flags the literal inside a shorthand initial', () => {
    const source = register('--cngx-g-outline', '2px solid oklch(0.66  0.19 50)');
    expect(emberInitialRegistrations(source)).toEqual(['--cngx-g-outline']);
    expect(repoOffenders([{ rel, source }]).map(key)).toEqual([`G --cngx-g-outline ${rel}`]);
  });

  it('flags the dark-twin literal', () => {
    const source = register('--cngx-g-ink', 'oklch(0.72 0.18 50)');
    expect(repoOffenders([{ rel, source }]).map(key)).toEqual([`G --cngx-g-ink ${rel}`]);
  });

  it('passes a token a component sheet assigns', () => {
    const source = register('--cngx-g-bg', 'oklch(0.66 0.19 50)');
    const assigning = {
      rel: 'projects/ui/y/y.css',
      source: '.y { --cngx-g-bg: var(--cngx-color-primary, oklch(0.66 0.19 50)); }',
    };
    expect(repoOffenders([{ rel, source }, assigning]).map(key)).toEqual([]);
  });

  it('still flags a token only a theme bridge assigns', () => {
    const registering = { rel, source: register('--cngx-g-bg', 'oklch(0.66 0.19 50)') };
    const bridge = { rel: 'projects/themes/x/bridge.css', source: ':root { --cngx-g-bg: red; }' };
    expect(repoOffenders([registering], assignedAcross([registering, bridge])).map(key)).toEqual([
      `G --cngx-g-bg ${rel}`,
    ]);
  });

  it('still flags a token assigned only inside a comment', () => {
    const raw = `${register('--cngx-g-bg', 'oklch(0.66 0.19 50)')} /* .a { --cngx-g-bg: red; } */`;
    expect(repoOffenders([{ rel, source: scannedSource(rel, raw) }]).map(key)).toEqual([
      `G --cngx-g-bg ${rel}`,
    ]);
  });

  it('passes a non-Ember initial', () => {
    const source = [
      register('--cngx-g-knob', 'oklch(1 0 0)'),
      register('--cngx-g-tint', 'oklch(0.96 0.04 50)'),
      register('--cngx-g-hue', 'oklch(0.66 0.19 500)'),
    ].join('\n');
    expect(emberInitialRegistrations(source)).toEqual([]);
    expect(
      unassignedEmberInitials(new Map([[rel, emberInitialRegistrations(source)]]), new Set()),
    ).toEqual([]);
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

  it('no translucent primary literal outside an initial-value (Rule F, no allowlist)', () => {
    expect(offenders.filter((row) => row.startsWith('F '))).toEqual([]);
    expect(ALLOWLIST.filter((row) => row.rule === 'F')).toEqual([]);
  });

  it('no Ember initial on an unassigned token (Rule G, no allowlist)', () => {
    expect(offenders.filter((row) => row.startsWith('G '))).toEqual([]);
    expect(ALLOWLIST.filter((row) => row.rule === 'G')).toEqual([]);
  });
});
