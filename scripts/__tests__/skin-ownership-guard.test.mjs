// Skin and story ownership guard.
//
// S0  a skin (`projects/*/theming/components/*.css`) is switched on by a class,
//     never by a directive attribute (`[cngxMenu]`): a host directive writes
//     no attribute, so an attribute-keyed skin reaches only the templates that
//     spell it out, and the organisms among them have to compensate. An
//     attribute selector passes in a compound with a top-level cngx class
//     (the element itself opted in) or inside `:where()` (a zero-specificity
//     UA reset every owner beats; the guard cannot tell a reset from paint,
//     review can). A class on an ancestor or an `@scope (<class>)` root does
//     not opt the element in: an organism inside the opted-in container
//     still carries the attribute.
// S1  a skin (`projects/*/theming/components/*.css`) or a ui component
//     stylesheet (`projects/ui/**/*.css`) selects only its own classes and the
//     classes of lower-level or imported entries. It fails on a class whose
//     owner sits on a higher level, or on the same level outside the own
//     entry's transitive `@cngx/*` import closure (an independent sibling).
//     A class inside `:not()` counts like any other: a base that excludes a
//     consumer by class names that consumer.
// S5  a story under `examples/stories/<lib>/<entry>/` lists in `apiComponents`
//     no artifact of a higher-level or independent-sibling entry, except the
//     neutral story symbols. `examples/stories/core/**` is exempt: core
//     renders nothing, its stories need a carrier. A carrier home
//     (`forms/field`) renders no value control either, so its stories may
//     list a same-level entry that imports it (the input or select the field
//     contract runs on).
// S6  an exception lives only as a row of SKIN_OPT_IN_EXEMPT,
//     SKIN_OWNERSHIP_EXEMPT or STORY_OWNERSHIP_EXEMPT, with exact counts and a
//     reason. A row whose hits are gone fails as stale, so the ratchet only
//     shrinks.
//
// Class owner: the entry whose non-spec, comment-stripped TS/HTML writes the
// class literal (`host` class, `[class.x]`, `classList.*(...)` args, template
// `class=`). Fallback 1: the class without its `--modifier`. Fallback 2: the
// BEM block equals the stylesheet's own block (`cngx-accordion__region` in
// `cngx-accordion.css`, a consumer opt-in class) or a block an own entry
// writes (`cngx-skeleton__bone` in `skeleton-container.css`, whose host writes
// `cngx-skeleton`). A class no entry writes and outside the own blocks fails
// as unowned.
//
// Own entry: a skin's `@themes` symbols plus the entries that write its block
// class; a ui stylesheet's folder entry. The own level is the level of the lib
// the stylesheet lives in, never raised by a `@themes` symbol of a higher lib.
// Levels come from the `modules` rows of `sheriff.config.ts`.
//
// Allowed without a row: an own class; a positive class in the same compound
// as an own class (not inside `:not()`); the core context axes
// (`.cngx-density-*`, text-scale, motion, contrast, touch); any lower-level
// owner. Declaration values (token assignments) are never read; `@scope (...)
// to (...)` preludes are.
//
// Known limits: nesting (`&`) is not resolved against the parent rule, so a
// foreign class nested under an own class is judged on its own (S1), and a
// nested `&[cngxX]` under a class rule fails although `&` puts the class in
// its compound (S0). A class inside `:is()` does not opt an attribute in. A class
// built at runtime from a template string (`'cngx-' + x`) has no literal
// writer and reads as unowned when a stylesheet selects it.

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { beforeAll, describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');

/**
 * Symbols a story of any entry may list: the layout primitives a demo sits in,
 * and the one Reactive Forms CVA, which attaches by the `[formControl]`
 * selector to whatever control the story teaches.
 */
export const NEUTRAL_STORY_SYMBOLS = ['CngxStack', 'CngxGrid', 'CngxFormBridge'];

/** Story homes whose contract needs a control carrier from a dependent entry. */
export const CARRIER_HOMES = ['forms/field'];

const CONTEXT_AXIS = /^cngx-(density|text-scale|motion|contrast|touch)(-|$)/;

/**
 * Stylesheet selectors allowed to name a higher-level or sibling class. Exact
 * counts per (file, selector class); a new hit or a gone one fails.
 *
 * @type {{ file: string; selector: string; count: number; reason: string }[]}
 */
const SKIN_OWNERSHIP_EXEMPT = [];

// Which library templates write the attribute and what the skin does there.
const OPT_IN_REASON = {
  breadcrumb:
    'CngxBreadcrumbBar writes the attributes; the link font-size reaching it is under review',
  dialog:
    'the dialog outlet is the owner; the command palette sets the max-width hook and its own scrollbar-gutter',
  listbox: 'the select panels want this skin; paginator and multi-select neutralise parts of it',
  menu: 'only the breadcrumb overflow writes it and zeroes the menu surface tokens on its own class',
  popover: 'applies the offset CngxPopover writes inline; every writer wants it',
  slider: 'no template outside the slider family writes these attributes',
};

/**
 * Skin selectors allowed to key on a directive attribute. Exact counts per
 * (file, attribute); a new hit or a gone one fails.
 *
 * @type {{ file: string; selector: string; count: number; reason: string }[]}
 */
const SKIN_OPT_IN_EXEMPT = [
  {
    file: 'projects/common/theming/components/cngx-breadcrumb.css',
    selector: '[cngxBreadcrumb]',
    count: 2,
    reason: OPT_IN_REASON.breadcrumb,
  },
  {
    file: 'projects/common/theming/components/cngx-breadcrumb.css',
    selector: '[cngxBreadcrumbItem]',
    count: 3,
    reason: OPT_IN_REASON.breadcrumb,
  },
  {
    file: 'projects/common/theming/components/cngx-breadcrumb.css',
    selector: '[cngxBreadcrumbSeparator]',
    count: 1,
    reason: OPT_IN_REASON.breadcrumb,
  },
  {
    file: 'projects/common/theming/components/cngx-dialog.css',
    selector: '[cngxDialog]',
    count: 2,
    reason: OPT_IN_REASON.dialog,
  },
  {
    file: 'projects/common/theming/components/cngx-dialog.css',
    selector: '[cngxDialogDraggable]',
    count: 1,
    reason: OPT_IN_REASON.dialog,
  },
  {
    file: 'projects/common/theming/components/cngx-listbox.css',
    selector: '[cngxListbox]',
    count: 2,
    reason: OPT_IN_REASON.listbox,
  },
  {
    file: 'projects/common/theming/components/cngx-listbox.css',
    selector: '[cngxOption]',
    count: 1,
    reason: OPT_IN_REASON.listbox,
  },
  {
    file: 'projects/common/theming/components/cngx-menu.css',
    selector: '[cngxMenu]',
    count: 2,
    reason: OPT_IN_REASON.menu,
  },
  {
    file: 'projects/common/theming/components/cngx-menu.css',
    selector: '[cngxMenuItem]',
    count: 3,
    reason: OPT_IN_REASON.menu,
  },
  {
    file: 'projects/common/theming/components/cngx-menu.css',
    selector: '[cngxMenuItemCheckbox]',
    count: 4,
    reason: OPT_IN_REASON.menu,
  },
  {
    file: 'projects/common/theming/components/cngx-menu.css',
    selector: '[cngxMenuItemRadio]',
    count: 4,
    reason: OPT_IN_REASON.menu,
  },
  {
    file: 'projects/common/theming/components/cngx-menu.css',
    selector: '[cngxMenuItemSubmenu]',
    count: 3,
    reason: OPT_IN_REASON.menu,
  },
  {
    file: 'projects/common/theming/components/cngx-menu.css',
    selector: '[cngxMenuSeparator]',
    count: 2,
    reason: OPT_IN_REASON.menu,
  },
  {
    file: 'projects/common/theming/components/cngx-popover.css',
    selector: '[cngxPopover]',
    count: 1,
    reason: OPT_IN_REASON.popover,
  },
  {
    file: 'projects/common/theming/components/cngx-slider.css',
    selector: '[cngxSliderTrack]',
    count: 15,
    reason: OPT_IN_REASON.slider,
  },
  {
    file: 'projects/common/theming/components/cngx-slider.css',
    selector: '[cngxRangeSliderTrack]',
    count: 12,
    reason: OPT_IN_REASON.slider,
  },
  {
    file: 'projects/common/theming/components/cngx-slider.css',
    selector: '[cngxSliderThumb]',
    count: 3,
    reason: OPT_IN_REASON.slider,
  },
];

/**
 * Stories allowed to list a higher-level or sibling artifact in
 * `apiComponents`. One row per (story, symbol).
 *
 * @type {{ file: string; symbol: string; reason: string }[]}
 */
const STORY_OWNERSHIP_EXEMPT = [];

/** Blank comments, keeping every newline so line numbers stay true. */
function blank(text) {
  return text.replace(/[^\n]/g, ' ');
}

function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, blank);
}

function stripSourceComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/(^|[\s;{}(),])\/\/[^\n]*/g, (m, lead) => lead + blank(m.slice(lead.length)));
}

function lineAt(text, index) {
  let line = 1;
  for (let i = 0; i < index; i++) {
    if (text.charCodeAt(i) === 10) {
      line++;
    }
  }
  return line;
}

/** `projects/<lib>/<entry>/...` -> `<lib>/<entry>`; a file at the lib root -> `<lib>/primary`. */
export function entryOf(path) {
  const parts = path.split('/');
  return parts.length > 3 ? `${parts[1]}/${parts[2]}` : `${parts[1]}/primary`;
}

const libOf = (entry) => entry.split('/')[0];

const CNGX_CLASS =
  /cngx-[a-z0-9]+(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?/g;

function classTokens(text) {
  return [...text.matchAll(CNGX_CLASS)].map((m) => m[0]);
}

/** A literal made of class names only (`'a b'`, `` `a a--${v}` ``); null otherwise. */
function classList(literal) {
  const tokens = literal
    .replace(/\$\{[^}]*\}/g, '\u0000')
    .trim()
    .split(/\s+/);
  if (!tokens.every((t) => /^[a-z0-9_\u0000-]+$/.test(t))) {
    return null;
  }
  return tokens.filter((t) => !t.includes('\u0000') && /^cngx-/.test(t));
}

// A literal in one of these positions names a class or tag without writing
// it: a component selector, a class test, a DOM query, a uid prefix. Read as a
// writer, a lower entry's `nextUid('cngx-button')` would clear `.cngx-button`
// in every skin.
const NON_WRITING_LITERAL =
  /(\bselector\s*:\s*|\b(?:contains|querySelector|querySelectorAll|closest|matches|nextUid|uid)\s*\(\s*)(['"`])[^'"`\n]*\2/g;

/**
 * Every class literal a TS/HTML source writes: a string literal that holds
 * class names only (host `class`, `classList.add/remove/toggle(...)` and
 * `addClass` args, class-name constants), `[class.x]`, and template `class=` /
 * `*Class=` attributes.
 */
export function writtenClasses(source) {
  const text = stripSourceComments(source).replace(NON_WRITING_LITERAL, "$1''");
  const out = new Set();
  const add = (classes) => {
    for (const cls of classes ?? []) {
      out.add(cls);
    }
  };
  for (const m of text.matchAll(/'([^'\n]*)'|"([^"\n]*)"|`([^`]*)`/g)) {
    add(classList(m[1] ?? m[2] ?? m[3]));
  }
  for (const m of text.matchAll(/\[class\.([a-z0-9_-]+)\]/g)) {
    add(classTokens(m[1]));
  }
  for (const m of text.matchAll(/\b(?:class|[a-zA-Z]+Class)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    add(classTokens(m[1] ?? m[2]));
  }
  return out;
}

/** `lib -> level` from the `modules` rows of `sheriff.config.ts`. */
export function readLevels(sheriffSource) {
  const levels = new Map();
  for (const m of sheriffSource.matchAll(/'lib:([a-z-]+)',\s*'level:(\d+)'/g)) {
    levels.set(m[1], Number(m[2]));
  }
  return levels;
}

function isLibrarySource(path) {
  return (
    /^projects\/[^/]+\/.+\.(ts|html)$/.test(path) &&
    !/\.spec\.ts$|\.d\.ts$/.test(path) &&
    !/(^|\/)(testing|schematics|examples|__test-helpers)\//.test(path) &&
    !path.startsWith('projects/testing/')
  );
}

/**
 * `{ owners: class -> Set<entry>, symbols: exported name -> entry }`. Symbols
 * cover classes, interfaces, types, constants and functions: `apiComponents`
 * lists tokens and `inject*` / `with*` functions next to directives.
 * over the library TS/HTML sources.
 *
 * @param {{ path: string; text: string }[]} files
 */
export function indexClassOwners(files) {
  const owners = new Map();
  const symbols = new Map();
  for (const { path, text } of files) {
    if (!isLibrarySource(path)) {
      continue;
    }
    const entry = entryOf(path);
    for (const cls of writtenClasses(text)) {
      if (!owners.has(cls)) {
        owners.set(cls, new Set());
      }
      owners.get(cls).add(entry);
    }
    if (path.endsWith('.ts')) {
      for (const m of stripSourceComments(text).matchAll(
        /export\s+(?:declare\s+)?(?:abstract\s+)?(?:class|interface|type|const|let|function)\s+(\w+)/g,
      )) {
        symbols.set(m[1], entry);
      }
    }
  }
  return { owners, symbols };
}

/**
 * `entry -> Set<entry>`: the entry itself plus every entry its library
 * sources reach through `@cngx/*` imports, transitively.
 *
 * @param {{ path: string; text: string }[]} files
 */
export function importClosure(files) {
  const deps = new Map();
  for (const { path, text } of files) {
    if (!isLibrarySource(path) || !path.endsWith('.ts')) {
      continue;
    }
    const entry = entryOf(path);
    if (!deps.has(entry)) {
      deps.set(entry, new Set());
    }
    for (const m of stripSourceComments(text).matchAll(
      /from\s+['"]@cngx\/([a-z-]+)(?:\/([a-z0-9-]+))?/g,
    )) {
      deps.get(entry).add(`${m[1]}/${m[2] ?? 'primary'}`);
    }
  }
  const closure = new Map();
  const reach = (entry) => {
    if (closure.has(entry)) {
      return closure.get(entry);
    }
    const seen = new Set([entry]);
    const stack = [entry];
    while (stack.length) {
      for (const dep of deps.get(stack.pop()) ?? []) {
        if (!seen.has(dep)) {
          seen.add(dep);
          stack.push(dep);
        }
      }
    }
    closure.set(entry, seen);
    return seen;
  };
  return { reach };
}

/**
 * The owners that make a class foreign for `own`: an owner on a higher level,
 * or on the same level outside the closure. Empty when any owner is own,
 * lower or imported.
 */
function foreignOwners(owners, own, index) {
  const verdicts = [];
  for (const owner of owners) {
    if (own.entries.has(owner)) {
      return [];
    }
    const level = index.levels.get(libOf(owner));
    if (level < own.level) {
      return [];
    }
    if (level === own.level && [...own.entries].some((e) => index.closure.reach(e).has(owner))) {
      return [];
    }
    verdicts.push({ owner, level, kind: level > own.level ? 'higher' : 'sibling' });
  }
  return verdicts;
}

function ownersOf(cls, index) {
  return index.owners.get(cls) ?? index.owners.get(cls.replace(/--.*$/, '')) ?? new Set();
}

const blockOf = (cls) => cls.replace(/--.*$/, '').replace(/__.*$/, '');

function isOwnClass(cls, own, index) {
  const block = blockOf(cls);
  if (block === own.block) {
    return true;
  }
  const ownedBy = (c) => [...ownersOf(c, index)].some((o) => own.entries.has(o));
  return ownedBy(cls) || ownedBy(block);
}

// Selectors are read with a small scanner, not a CSS parser: postcss is only a
// transitive dependency, and the guard needs nothing but class names and their
// compound.
const SKIPPED_AT_RULE =
  /^@(layer|media|supports|container|property|keyframes|font-face|page|starting-style)\b/;

/**
 * Every rule prelude of a stylesheet with its offset: selector lists of style
 * rules plus the parenthesised parts of `@scope`. Declaration values never
 * reach a prelude.
 */
function preludes(css) {
  const out = [];
  const re = /([^{};]+)\{/g;
  let m;
  while ((m = re.exec(css))) {
    const raw = m[1];
    const lead = raw.length - raw.trimStart().length;
    const text = raw.trim();
    const at = m.index + lead;
    if (
      SKIPPED_AT_RULE.test(text) ||
      /^(from|to|\d+(\.\d+)?%)(\s*,\s*(from|to|\d+(\.\d+)?%))*$/.test(text)
    ) {
      continue;
    }
    if (text.startsWith('@scope')) {
      for (const part of text.matchAll(/\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g)) {
        out.push({ text: part[1], at: at + part.index + 1 });
      }
      continue;
    }
    if (text.startsWith('@')) {
      continue;
    }
    out.push({ text, at });
  }
  return out;
}

/**
 * The cngx classes and directive attributes of one selector list. A class is
 * `{ cls, index, compound, positive }`, an attribute `{ name, index, compound,
 * fns }`. `positive` = at the top level of its compound, not inside a
 * functional pseudo-class; `compound` groups the top-level simple selectors
 * joined without a combinator; `fns` names the enclosing functional
 * pseudo-classes. HTML attribute names are case-insensitive, so is the match.
 */
function selectorParts(selector) {
  const classes = [];
  const attrs = [];
  const fns = [];
  let compound = 0;
  for (let i = 0; i < selector.length; i++) {
    const ch = selector[i];
    if (ch === '[') {
      const close = selector.indexOf(']', i);
      const end = close === -1 ? selector.length : close;
      const m = /^\s*(cngx[a-z][a-z0-9]*)/i.exec(selector.slice(i + 1, end));
      if (m) {
        attrs.push({ name: m[1], index: i, compound, fns: [...fns] });
      }
      i = end;
      continue;
    }
    if (ch === '"' || ch === "'") {
      const close = selector.indexOf(ch, i + 1);
      i = close === -1 ? selector.length : close;
      continue;
    }
    if (ch === '(') {
      fns.push(/:([a-z-]+)$/.exec(selector.slice(0, i))?.[1] ?? '');
      continue;
    }
    if (ch === ')') {
      fns.pop();
      continue;
    }
    if (fns.length === 0 && /[\s>+~,]/.test(ch)) {
      compound++;
      continue;
    }
    if (ch === '.') {
      const m = /^cngx-[a-z0-9_-]+/.exec(selector.slice(i + 1));
      if (m) {
        classes.push({ cls: m[0], index: i + 1, compound, positive: fns.length === 0 });
        i += m[0].length;
      }
    }
  }
  return { classes, attrs };
}

/**
 * S1 hits of one stylesheet.
 *
 * @param {string} file repo-relative path
 * @param {string} css stylesheet source
 * @param {{ owners: Map<string, Set<string>>; symbols: Map<string, string>; levels: Map<string, number>; closure: { reach(entry: string): Set<string> } }} index
 */
export function scanSkinCss(file, css, index) {
  const own = ownEntryOfStylesheet(file, css, index);
  const text = stripCssComments(css);
  const hits = [];
  for (const prelude of preludes(text)) {
    const { classes } = selectorParts(prelude.text);
    const ownCompounds = new Set(
      classes.filter((c) => c.positive && isOwnClass(c.cls, own, index)).map((c) => c.compound),
    );
    for (const c of classes) {
      if (CONTEXT_AXIS.test(c.cls) || isOwnClass(c.cls, own, index)) {
        continue;
      }
      if (c.positive && ownCompounds.has(c.compound)) {
        continue;
      }
      const line = lineAt(text, prelude.at + c.index);
      const owners = ownersOf(c.cls, index);
      if (owners.size === 0) {
        hits.push({
          rule: 'S1',
          file,
          line,
          key: `.${c.cls}`,
          owner: 'none',
          detail: 'unowned class outside the file block',
        });
        continue;
      }
      const foreign = foreignOwners(owners, own, index);
      if (foreign.length === 0) {
        continue;
      }
      hits.push({
        rule: 'S1',
        file,
        line,
        key: `.${c.cls}`,
        owner: foreign.map((f) => `${f.owner} (level ${f.level}, ${f.kind})`).join(', '),
        detail: `own ${[...own.entries].join(', ') || own.block} (level ${own.level})`,
      });
    }
  }
  return hits;
}

/**
 * S0 hits of one skin: a directive attribute selector outside `:where()` whose
 * compound carries no top-level cngx class.
 *
 * @param {string} file repo-relative path
 * @param {string} css stylesheet source
 */
export function scanSkinOptIn(file, css) {
  const text = stripCssComments(css);
  const hits = [];
  for (const prelude of preludes(text)) {
    const { classes, attrs } = selectorParts(prelude.text);
    for (const attr of attrs) {
      const optedIn = classes.some((c) => c.positive && c.compound === attr.compound);
      if (optedIn || attr.fns.includes('where')) {
        continue;
      }
      hits.push({
        rule: 'S0',
        file,
        line: lineAt(text, prelude.at + attr.index),
        key: `[${attr.name}]`,
        owner: 'its directive',
        detail: 'keyed outside :where() and outside a compound with a class',
      });
    }
  }
  return hits;
}

function ownEntryOfStylesheet(file, css, index) {
  const lib = file.split('/')[1];
  const level = index.levels.get(lib);
  const name = file
    .split('/')
    .pop()
    .replace(/\.css$/, '')
    .replace(/\.component$/, '');
  if (file.includes('/theming/components/')) {
    const block = name;
    const entries = new Set(index.owners.get(block) ?? []);
    for (const m of css.matchAll(/@themes\s+([^\n*]+)/g)) {
      for (const symbol of m[1].split(',')) {
        const entry = index.symbols.get(symbol.trim());
        if (entry) {
          entries.add(entry);
        }
      }
    }
    return { entries, level, block };
  }
  return { entries: new Set([entryOf(file)]), level, block: `cngx-${name}` };
}

/**
 * S5 hits of one story: `apiComponents` symbols of a higher-level or
 * independent-sibling entry. `examples/stories/core/**` is skipped; a carrier
 * home accepts a sibling that imports it.
 */
export function scanStory(file, source, index) {
  const parts = file.split('/');
  if (parts[2] === 'core' || parts.length < 5) {
    return [];
  }
  const home = `${parts[2]}/${parts[3]}`;
  const own = { entries: new Set([home]), level: index.levels.get(parts[2]) };
  const list = /apiComponents\s*:\s*\[([^\]]*)\]/.exec(source);
  if (!list) {
    return [];
  }
  const hits = [];
  const base = list.index + list[0].indexOf('[') + 1;
  for (const m of list[1].matchAll(/['"](\w+)['"]/g)) {
    const symbol = m[1];
    const owner = index.symbols.get(symbol);
    if (!owner || NEUTRAL_STORY_SYMBOLS.includes(symbol)) {
      continue;
    }
    const foreign = foreignOwners(new Set([owner]), own, index);
    if (foreign.length === 0 || isCarrier(home, foreign[0], index)) {
      continue;
    }
    hits.push({
      rule: 'S5',
      file,
      line: lineAt(source, base + m.index),
      key: symbol,
      owner: `${owner} (level ${foreign[0].level}, ${foreign[0].kind})`,
      detail: `story home ${home} (level ${own.level})`,
    });
  }
  return hits;
}

function isCarrier(home, verdict, index) {
  return (
    CARRIER_HOMES.includes(home) &&
    verdict.kind === 'sibling' &&
    index.closure.reach(verdict.owner).has(home)
  );
}

/**
 * Hits no row covers, rows that do not match their hits exactly, and rows
 * without a reason. CSS rows carry `selector` + `count`; story rows carry
 * `symbol` and stand for one hit.
 */
export function exemptionProblems(hits, rows) {
  const counted = new Map();
  for (const hit of hits) {
    const id = `${hit.file}|${hit.key}`;
    counted.set(id, [...(counted.get(id) ?? []), hit]);
  }
  const out = [];
  const covered = new Set();
  for (const row of rows) {
    const key = row.selector ?? row.symbol;
    const id = `${row.file}|${key}`;
    covered.add(id);
    if (!row.reason?.trim()) {
      out.push(`${row.file} ${key}: exemption without a reason`);
    }
    const actual = (counted.get(id) ?? []).length;
    const expected = row.count ?? 1;
    if (actual === 0) {
      out.push(`${row.file} ${key}: stale exemption, no hit left; delete the row`);
    } else if (actual !== expected) {
      out.push(`${row.file} ${key}: source ${actual}, exemption ${expected}`);
    }
  }
  for (const [id, group] of counted) {
    if (covered.has(id)) {
      continue;
    }
    for (const hit of group) {
      out.push(
        `${hit.rule} ${hit.file}:${hit.line} ${hit.key} owned by ${hit.owner}; ${hit.detail}`,
      );
    }
  }
  return out;
}

// git ls-files in a checkout; a plain walk for an extracted tree (git archive)
// so another branch can be scanned without touching its worktree.
function listFiles(root) {
  if (existsSync(resolve(root, '.git'))) {
    return execFileSync('git', ['ls-files', 'projects', 'examples/stories'], {
      cwd: root,
      encoding: 'utf8',
    })
      .split('\n')
      .filter(Boolean);
  }
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = resolve(dir, name);
      if (name === 'node_modules') {
        continue;
      }
      if (statSync(full).isDirectory()) {
        walk(full);
      } else {
        out.push(relative(root, full).replaceAll('\\', '/'));
      }
    }
  };
  for (const top of ['projects', 'examples/stories']) {
    if (existsSync(resolve(root, top))) {
      walk(resolve(root, top));
    }
  }
  return out;
}

export function isGuardedStylesheet(path) {
  return (
    /^projects\/[^/]+\/theming\/components\/[^/]+\.css$/.test(path) ||
    (/^projects\/ui\/.+\.css$/.test(path) && !/(^|\/)(testing|examples)\//.test(path))
  );
}

/** Every S0, S1 and S5 hit of the checkout at `root`. */
export function scanRepo(root = REPO_ROOT) {
  const paths = listFiles(root);
  const read = (path) => readFileSync(resolve(root, path), 'utf8');
  const sources = paths.filter(isLibrarySource).map((path) => ({ path, text: read(path) }));
  const { owners, symbols } = indexClassOwners(sources);
  const index = {
    owners,
    symbols,
    levels: readLevels(read('sheriff.config.ts')),
    closure: importClosure(sources),
  };
  const css = paths
    .filter(isGuardedStylesheet)
    .flatMap((path) => scanSkinCss(path, read(path), index));
  const stories = paths
    .filter((path) => path.startsWith('examples/stories/') && path.endsWith('.story.ts'))
    .flatMap((path) => scanStory(path, read(path), index));
  const optIn = paths
    .filter((path) => /^projects\/[^/]+\/theming\/components\/[^/]+\.css$/.test(path))
    .flatMap((path) => scanSkinOptIn(path, read(path)));
  return { css, stories, optIn, index };
}

// A tiny repo: common/interactive imports common/a11y but not common/popover,
// so the popover classes stand in for an independent sibling.
const SHERIFF = [
  "'projects/core': ['lib:core', 'level:1', 'entry:primary', 'scope:lib'],",
  "'projects/common': ['lib:common', 'level:2', 'entry:primary', 'scope:lib'],",
  "'projects/forms': ['lib:forms', 'level:3', 'entry:primary', 'scope:lib'],",
  "'projects/ui': ['lib:ui', 'level:4', 'entry:primary', 'scope:lib'],",
].join('\n');

const FIXTURE_SOURCES = [
  {
    path: 'projects/core/theming/axis.ts',
    text: [
      "export class CngxCoreThing { host = { class: 'cngx-core-thing' }; }",
      "@Component({ selector: 'cngx-popover-panel' })",
      'export class CngxCoreReader {',
      "  id = nextUid('cngx-select__panel');",
      "  open = el.classList.contains('cngx-icon') || el.closest('cngx-listbox');",
      '}',
    ].join('\n'),
  },
  {
    path: 'projects/common/interactive/listbox.ts',
    text: [
      "import { CngxA11yThing } from '@cngx/common/a11y';",
      "@Directive({ host: { class: 'cngx-listbox', '[class.cngx-listbox--open]': 'open()' } })",
      'export class CngxListbox {}',
      "// el.classList.add('cngx-from-a-comment');",
    ].join('\n'),
  },
  {
    path: 'projects/common/a11y/thing.ts',
    text: "export class CngxA11yThing { constructor() { el.classList.add('cngx-a11y-thing'); } }",
  },
  {
    path: 'projects/common/popover/panel.ts',
    text: [
      '@Component({ template: \'<span class="cngx-icon"></span>\' })',
      'export class CngxPopoverPanel {',
      '  cls = `cngx-popover-panel cngx-popover-panel--${this.variant}`;',
      '}',
    ].join('\n'),
  },
  {
    path: 'projects/forms/select/select.ts',
    text: [
      "import { CngxFormField } from '@cngx/forms/field';",
      "export class CngxSelect { panelClass = 'cngx-select__panel'; }",
      "export const CNGX_SELECT_THING = new InjectionToken<string>('thing');",
      'export function injectSelectThing() {}',
      'export interface CngxSelectRef {}',
    ].join('\n'),
  },
  { path: 'projects/forms/field/form-field.ts', text: 'export class CngxFormField {}' },
  {
    path: 'projects/forms/controls/form-bridge.ts',
    text: 'export class CngxFormBridge {}\nexport class CngxTypedControl {}',
  },
  { path: 'projects/ui/layout/stack.ts', text: 'export class CngxStack {}' },
  {
    path: 'projects/ui/speak/speak.ts',
    text: "export class CngxSpeakButton { host = { class: 'cngx-speak' }; }",
  },
  {
    path: 'projects/common/interactive/listbox.spec.ts',
    text: "el.classList.add('cngx-spec-only');",
  },
];

function fixtureIndex() {
  const { owners, symbols } = indexClassOwners(FIXTURE_SOURCES);
  return { owners, symbols, levels: readLevels(SHERIFF), closure: importClosure(FIXTURE_SOURCES) };
}

const SKIN = 'projects/common/theming/components/cngx-listbox.css';
const skin = (body) => scanSkinCss(SKIN, `/** @themes CngxListbox */\n${body}`, fixtureIndex());
const keys = (hits) => hits.map((h) => `${h.line} ${h.key}`);

describe('skin-ownership guard - class owners', () => {
  it('reads host classes, [class.x], classList args and literal classes, never comments, specs, selectors, class tests, queries or uid prefixes', () => {
    const { owners } = fixtureIndex();
    expect(owners.get('cngx-listbox')).toEqual(new Set(['common/interactive']));
    expect(owners.get('cngx-listbox--open')).toEqual(new Set(['common/interactive']));
    expect(owners.get('cngx-a11y-thing')).toEqual(new Set(['common/a11y']));
    expect(owners.get('cngx-popover-panel')).toEqual(new Set(['common/popover']));
    expect(owners.get('cngx-icon')).toEqual(new Set(['common/popover']));
    expect(owners.has('cngx-from-a-comment')).toBe(false);
    expect(owners.get('cngx-select__panel')).toEqual(new Set(['forms/select']));
    expect(owners.has('cngx-spec-only')).toBe(false);
  });

  it('reads levels from the sheriff modules rows and imports transitively', () => {
    const index = fixtureIndex();
    expect(index.levels.get('common')).toBe(2);
    expect(index.levels.get('ui')).toBe(4);
    expect(index.closure.reach('common/interactive').has('common/a11y')).toBe(true);
    expect(index.closure.reach('common/interactive').has('common/popover')).toBe(false);
  });
});

describe('skin-ownership guard - S1 stylesheets', () => {
  it('passes an own class and its modifier', () => {
    expect(skin('.cngx-listbox { color: red; }\n.cngx-listbox--open { color: blue; }')).toEqual([]);
  });

  it('passes a sibling class in the same compound as an own class', () => {
    expect(skin('.cngx-listbox.cngx-icon { inline-size: 1em; }')).toEqual([]);
  });

  it('fails the sibling class on its own and as a descendant of an own class', () => {
    expect(
      keys(skin('.cngx-icon { color: red; }\n.cngx-listbox .cngx-icon { color: red; }')),
    ).toEqual(['2 .cngx-icon', '3 .cngx-icon']);
  });

  it('fails a higher-level class inside :not(), the inverse case', () => {
    const hits = skin(':where(.cngx-listbox):not(:where(.cngx-select__panel)) { color: red; }');
    expect(keys(hits)).toEqual(['2 .cngx-select__panel']);
    expect(hits[0].owner).toBe('forms/select (level 3, higher)');
  });

  it('never reads a declaration value', () => {
    expect(skin('.cngx-listbox { --cngx-x: .cngx-select__panel; content: ".cngx-icon"; }')).toEqual(
      [],
    );
  });

  it('reads both parts of an @scope prelude', () => {
    expect(
      keys(skin('@scope (.cngx-listbox) to (.cngx-popover-panel) { :scope { color: red; } }')),
    ).toEqual(['2 .cngx-popover-panel']);
  });

  it('passes a lower-level owner and an imported same-level owner', () => {
    expect(
      skin('.cngx-core-thing .cngx-listbox { color: red; }\n.cngx-a11y-thing { color: red; }'),
    ).toEqual([]);
  });

  it('fails a same-level owner outside the import closure', () => {
    const hits = skin('.cngx-popover-panel [cngxMenu] { box-shadow: none; }');
    expect(keys(hits)).toEqual(['2 .cngx-popover-panel']);
    expect(hits[0].owner).toBe('common/popover (level 2, sibling)');
  });

  it('passes the core context axes', () => {
    expect(
      skin('.cngx-density-compact .cngx-listbox, .cngx-motion-reduced .cngx-listbox { gap: 0; }'),
    ).toEqual([]);
  });

  it('fails an unowned class outside the file block and passes a consumer opt-in class in it', () => {
    expect(
      keys(skin('.cngx-nobody { color: red; }\n.cngx-listbox__region { color: red; }')),
    ).toEqual(['2 .cngx-nobody']);
  });

  it('passes an element of a block the own entry writes, not of an unwritten one', () => {
    const css = '.cngx-speak__bone {}\n.cngx-nobody__bone {}';
    expect(keys(scanSkinCss('projects/ui/speak/speak-button.css', css, fixtureIndex()))).toEqual([
      '2 .cngx-nobody__bone',
    ]);
  });

  it('judges a skin at the level of its lib, not of a higher @themes symbol', () => {
    const css = '/** @themes CngxListbox, CngxSpeakButton */\n.cngx-select__panel { color: red; }';
    expect(keys(scanSkinCss(SKIN, css, fixtureIndex()))).toEqual(['2 .cngx-select__panel']);
  });

  it('owns a ui stylesheet by its folder entry', () => {
    expect(
      keys(
        scanSkinCss('projects/ui/speak/speak-button.css', '.cngx-select__panel {}', fixtureIndex()),
      ),
    ).toEqual([]);
    expect(
      keys(
        scanSkinCss(
          'projects/forms/select/select.css',
          '.cngx-popover-panel .cngx-select__panel {}',
          fixtureIndex(),
        ),
      ),
    ).toEqual([]);
  });
});

describe('skin-ownership guard - S0 opt-in by class', () => {
  const optIn = (body) => keys(scanSkinOptIn(SKIN, `/* [cngxNotRead] */\n${body}`));

  it('fails a bare attribute, one under an ancestor class, one before a class and a lowercase one', () => {
    expect(
      optIn(
        [
          '[cngxListbox] { color: red; }',
          '.cngx-listbox [cngxOption] {}',
          '.cngx-listbox > [cngxOption] {}',
          '[cngxListbox] .cngx-listbox__item {}',
          ':not(.cngx-a)[cngxOption] {}',
          '[cngxoption] {}',
        ].join('\n'),
      ),
    ).toEqual([
      '2 [cngxListbox]',
      '3 [cngxOption]',
      '4 [cngxOption]',
      '5 [cngxListbox]',
      '6 [cngxOption]',
      '7 [cngxoption]',
    ]);
  });

  it('fails an attribute inside @scope (<class>) and in an @scope root or limit', () => {
    expect(
      optIn(
        [
          '@scope (.cngx-listbox) { [cngxOption] { color: red; } }',
          '@scope ([cngxListbox]) to ([cngxOption]) { :scope {} }',
        ].join('\n'),
      ),
    ).toEqual(['2 [cngxOption]', '3 [cngxListbox]', '3 [cngxOption]']);
  });

  it('passes a class in the compound, either side, and :where()', () => {
    expect(
      optIn(
        [
          ':where([cngxListbox]) { margin: 0; }',
          '.cngx-listbox[cngxListbox]:focus-visible {}',
          '[cngxOption].cngx-listbox__option {}',
          '.cngx-listbox .cngx-listbox__option[cngxOption] {}',
          ':is([cngxSliderTrack], [cngxRangeSliderTrack]).cngx-slider {}',
        ].join('\n'),
      ),
    ).toEqual([]);
  });

  it('judges each selector of a list on its own', () => {
    expect(optIn('.cngx-listbox[cngxOption], [cngxOption] {}')).toEqual(['2 [cngxOption]']);
  });

  it('never reads a declaration value or an attribute that is no directive', () => {
    expect(
      optIn(".cngx-listbox { --x: '[cngxOption]'; }\n[data-cngx-open] {}\n[cngx-x] {}"),
    ).toEqual([]);
  });
});

describe('skin-ownership guard - S5 stories', () => {
  const story = (file, list) =>
    scanStory(file, `export const S = { apiComponents: [${list}] };`, fixtureIndex());

  it('fails a higher-level and an independent-sibling symbol', () => {
    expect(
      keys(
        story(
          'examples/stories/common/interactive/listbox/basic.story.ts',
          "'CngxListbox', 'CngxSelect', 'CngxPopoverPanel'",
        ),
      ),
    ).toEqual(['1 CngxSelect', '1 CngxPopoverPanel']);
  });

  it('passes own, lower and imported symbols and the neutral layout primitives', () => {
    expect(
      story(
        'examples/stories/common/interactive/listbox/basic.story.ts',
        "'CngxListbox', 'CngxA11yThing', 'CngxCoreThing', 'CngxStack'",
      ),
    ).toEqual([]);
  });

  it('resolves tokens, functions and interfaces, not only classes', () => {
    expect(
      keys(
        story(
          'examples/stories/common/interactive/listbox/basic.story.ts',
          "'CNGX_SELECT_THING', 'injectSelectThing', 'CngxSelectRef'",
        ),
      ),
    ).toEqual(['1 CNGX_SELECT_THING', '1 injectSelectThing', '1 CngxSelectRef']);
  });

  it('passes a carrier that imports forms/field in a field story, nowhere else', () => {
    const field = 'examples/stories/forms/field/skin/fill.story.ts';
    expect(story(field, "'CngxFormField', 'CngxSelect'")).toEqual([]);
    expect(keys(story(field, "'CngxTypedControl', 'CngxSpeakButton'"))).toEqual([
      '1 CngxTypedControl',
      '1 CngxSpeakButton',
    ]);
    expect(keys(story('examples/stories/forms/controls/typed/basic.story.ts', "'CngxSelect'"))).toEqual([
      '1 CngxSelect',
    ]);
  });

  it('passes CngxFormBridge as a neutral symbol', () => {
    expect(story('examples/stories/forms/select/rf/basic.story.ts', "'CngxSelect', 'CngxFormBridge'")).toEqual(
      [],
    );
  });

  it('skips examples/stories/core/**', () => {
    expect(story('examples/stories/core/theming/basic.story.ts', "'CngxSelect'")).toEqual([]);
  });
});

describe('skin-ownership guard - S6 ratchet', () => {
  const hit = {
    rule: 'S1',
    file: 'a.css',
    line: 3,
    key: '.cngx-x',
    owner: 'ui/x (level 4, higher)',
    detail: 'own',
  };

  it('reports a stale row, a wrong count and a reasonless row', () => {
    expect(
      exemptionProblems([], [{ file: 'a.css', selector: '.cngx-x', count: 1, reason: 'r' }]),
    ).toEqual(['a.css .cngx-x: stale exemption, no hit left; delete the row']);
    expect(
      exemptionProblems(
        [hit, hit],
        [{ file: 'a.css', selector: '.cngx-x', count: 1, reason: ' ' }],
      ),
    ).toEqual([
      'a.css .cngx-x: exemption without a reason',
      'a.css .cngx-x: source 2, exemption 1',
    ]);
  });

  it('reports a hit no row covers with its rule, place and owner', () => {
    expect(exemptionProblems([hit], [])).toEqual([
      'S1 a.css:3 .cngx-x owned by ui/x (level 4, higher); own',
    ]);
  });

  it('matches a story row by symbol', () => {
    const storyHit = { ...hit, rule: 'S5', file: 's.story.ts', key: 'CngxX' };
    expect(
      exemptionProblems([storyHit], [{ file: 's.story.ts', symbol: 'CngxX', reason: 'r' }]),
    ).toEqual([]);
  });
});

describe('skin-ownership guard - projects/** and examples/stories/**', () => {
  let result;
  beforeAll(() => {
    result = scanRepo();
  });

  it('S0: no skin keys on a directive attribute outside an opt-in class or the exemptions', () => {
    expect(
      exemptionProblems(result.optIn, SKIN_OPT_IN_EXEMPT),
      'Switch the skin on by a class (.cngx-x) and let the directive or the consumer write it; a UA reset may stay at :where([cngxX]).',
    ).toEqual([]);
  });

  it('S1: no skin or ui stylesheet selects a higher-level or independent-sibling class outside the exemptions', () => {
    expect(
      exemptionProblems(result.css, SKIN_OWNERSHIP_EXEMPT),
      'Select only own classes and those of lower or imported entries; a consumer sets the tokens the owner offers.',
    ).toEqual([]);
  });

  it('S5: no story lists a higher-level or independent-sibling artifact outside the exemptions', () => {
    expect(
      exemptionProblems(result.stories, STORY_OWNERSHIP_EXEMPT),
      'Keep the story with the artifact whose contract it teaches; CngxStack and CngxGrid are neutral.',
    ).toEqual([]);
  });

  it('flags a consumer class added to a real skin', () => {
    const css = readFileSync(
      resolve(REPO_ROOT, 'projects/common/theming/components/cngx-listbox.css'),
      'utf8',
    );
    const hits = scanSkinCss(
      'projects/common/theming/components/cngx-listbox.css',
      `${css}\n.cngx-select__panel {}\n`,
      result.index,
    );
    expect(hits.map((h) => `${h.rule} ${h.key} ${h.owner}`)).toEqual([
      'S1 .cngx-select__panel forms/select (level 3, higher)',
    ]);
  });
});
