import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Repo-wide static guard against `[attr.aria-*]` bound on a cngx host whose
 * component takes that attribute as an input alias
 * (`input(..., { alias: 'aria-label' })`).
 *
 * `[attr.aria-label]` writes the DOM attribute directly and leaves the input
 * unset. What the consumer sees depends on the component, and neither outcome
 * is the intended name:
 *   - a component that host-binds its own `[attr.aria-label]` (the chart
 *     presets, tab group, stepper) overwrites the consumer's value with `null`
 *     or its default;
 *   - a component that forwards the input to an inner element (`CngxSelect`
 *     names its combobox trigger) leaves the label on the inert host and the
 *     focusable element unnamed.
 * The fix is always the input binding, `[aria-label]="..."`.
 *
 * The alias map is derived from source: every `@Component` / `@Directive` under
 * `projects/` declaring an `aria-*` input alias contributes its selector. A new
 * component is covered the moment it declares the alias.
 *
 * Scanned: `examples/stories/**` (the demos teach the binding),
 * `projects/**` `.ts` / `.html` / `.md` (library templates, the internal
 * examples, JSDoc and README snippets), minus `*.spec.*`. `[attr.aria-*]` on
 * plain HTML, or on a host that does not alias that attribute, is correct and
 * is never flagged.
 *
 * The allowlist is empty and asserted empty. A legitimate exception would be a
 * scope decision, not a silent entry.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const PROJECTS = resolve(REPO_ROOT, 'projects');
const STORIES = resolve(REPO_ROOT, 'examples', 'stories');

const ALLOWLIST = [];

/** Longest opening tag the scan accepts; real templates stay far below it. */
const MAX_TAG_LENGTH = 4000;

// --- file walking ----------------------------------------------------------

function walk(dir, pattern) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules') {
      continue;
    }
    const full = resolve(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full, pattern));
    } else if (pattern.test(entry) && !/\.spec\./.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

// --- alias map -------------------------------------------------------------

/**
 * Parses one selector list (`'cngx-x, [cngxY]'`) into matchers. Each matcher
 * carries an optional element name and the attribute names it requires.
 */
function parseSelector(selector) {
  return selector
    .split(',')
    .map((part) => part.trim().replace(/:not\([^)]*\)/g, ''))
    .filter(Boolean)
    .map((part) => ({
      element: /^[a-z][\w-]*/i.exec(part)?.[0]?.toLowerCase() ?? null,
      attrs: [...part.matchAll(/\[([\w-]+)(?:[~|^$*]?=[^\]]*)?\]/g)].map((m) => m[1].toLowerCase()),
    }));
}

/**
 * Maps each decorated class in `source` to its selector matchers and the
 * `aria-*` input aliases it declares. A decorator's class body runs until the
 * next decorator, so several classes per file stay separate.
 */
function collectAliasedHosts(source) {
  const decorators = [...source.matchAll(/@(?:Component|Directive)\(\s*\{/g)].map((m) => m.index);
  const hosts = [];
  decorators.forEach((start, i) => {
    const segment = source.slice(start, decorators[i + 1] ?? source.length);
    const selector = /selector:\s*(['"`])([^'"`]+)\1/.exec(segment)?.[2];
    const aliases = [
      ...new Set([...segment.matchAll(/alias:\s*['"`](aria-[a-z]+)['"`]/g)].map((m) => m[1])),
    ];
    if (selector && aliases.length > 0) {
      hosts.push({ selector, matchers: parseSelector(selector), aliases });
    }
  });
  return hosts;
}

function loadAliasedHosts() {
  return walk(PROJECTS, /\.ts$/).flatMap((file) => collectAliasedHosts(readFileSync(file, 'utf8')));
}

// --- template scan ---------------------------------------------------------

/**
 * Yields every opening tag in `text` as `{ name, attrs, index }`. The scan is
 * quote-aware so `>` inside a binding (`a > b`, `=>`) does not end the tag.
 */
function* openingTags(text) {
  const tagStart = /<([a-z][\w-]*)(?=[\s/>])/gi;
  let match;
  while ((match = tagStart.exec(text)) !== null) {
    let i = tagStart.lastIndex;
    let quote = null;
    while (i < text.length) {
      const ch = text[i];
      if (quote) {
        if (ch === quote) {
          quote = null;
        }
      } else if (ch === '"' || ch === "'") {
        quote = ch;
      } else if (ch === '>') {
        break;
      }
      i++;
    }
    // No closing `>` within reach: a false start such as a TS generic with an
    // unbalanced quote after it. Skip it instead of swallowing the rest of the file.
    if (i >= text.length || i - tagStart.lastIndex > MAX_TAG_LENGTH) {
      continue;
    }
    const body = text.slice(tagStart.lastIndex, i);
    const attrs = [...body.matchAll(/(?:^|\s)([[(*#]*[\w.@-]+[\])]*)(?==|\s|\/|$)/g)].map((m) =>
      m[1].toLowerCase(),
    );
    yield { name: match[1].toLowerCase(), attrs, index: match.index };
    tagStart.lastIndex = i;
  }
}

/** Strips binding syntax so `[cngxFoo]`, `(cngxFoo)` and `*cngxFoo` match `cngxfoo`. */
function bareName(attr) {
  return attr.replace(/^[[(*#]+/, '').replace(/[\])]+$/, '');
}

function matches(tag, matcher) {
  if (matcher.element && matcher.element !== tag.name) {
    return false;
  }
  const present = new Set(tag.attrs.map(bareName));
  return matcher.attrs.every((attr) => present.has(attr));
}

/**
 * Returns one offender per `[attr.aria-X]` bound on a tag matched by a host
 * that aliases `aria-X` as an input.
 */
function findOffenders(text, hosts, rel = 'fixture') {
  const offenders = [];
  for (const tag of openingTags(text)) {
    const bound = tag.attrs
      .map((attr) => /^\[attr\.(aria-[a-z]+)\]$/.exec(attr)?.[1])
      .filter(Boolean);
    if (bound.length === 0) {
      continue;
    }
    for (const host of hosts) {
      if (!host.matchers.some((m) => matches(tag, m))) {
        continue;
      }
      for (const aria of bound.filter((a) => host.aliases.includes(a))) {
        const line = text.slice(0, tag.index).split('\n').length;
        offenders.push(
          `${rel}:${line} <${tag.name}> [attr.${aria}] -> use [${aria}] (input alias on ${host.selector})`,
        );
      }
    }
  }
  return offenders;
}

// --- tests -----------------------------------------------------------------

describe('aria input-alias binding guard', () => {
  const hosts = loadAliasedHosts();

  it('derives the aliased hosts from source', () => {
    // Sanity floor: the chart presets, tabs, stepper and select family alias
    // aria-label today. A collapse to zero means the derivation broke, not
    // that the surface went away.
    expect(hosts.length).toBeGreaterThanOrEqual(20);
    expect(hosts.map((h) => h.selector)).toContain('cngx-bullet');
  });

  it('no story or library template binds [attr.aria-*] on a host that aliases it', () => {
    const files = [...walk(STORIES, /\.ts$/), ...walk(PROJECTS, /\.(ts|html|md)$/)];
    const offenders = files
      .flatMap((file) =>
        findOffenders(readFileSync(file, 'utf8'), hosts, relative(REPO_ROOT, file)),
      )
      .filter((o) => !ALLOWLIST.some((entry) => o.startsWith(entry)));
    expect(
      offenders,
      `Bind the input alias instead of the DOM attribute:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });

  it('keeps the allowlist empty', () => {
    expect(ALLOWLIST).toEqual([]);
  });

  it('flags the defect and leaves correct bindings alone', () => {
    const fixtureHosts = [
      ...collectAliasedHosts(`
        @Component({ selector: 'cngx-meter' })
        class A { readonly l = input(null, { alias: 'aria-label' }); }
        @Directive({ selector: '[cngxNamed], cngx-named' })
        class B { readonly l = input(null, { alias: 'aria-labelledby' }); }
        @Component({ selector: 'cngx-plain' })
        class C { readonly v = input(0); }
      `),
    ];
    expect(fixtureHosts.map((h) => h.selector)).toEqual(['cngx-meter', '[cngxNamed], cngx-named']);

    const offenders = (t) => findOffenders(t, fixtureHosts);

    // element selector, single- and multi-line
    expect(offenders(`<cngx-meter [value]="1" [attr.aria-label]="x" />`)).toHaveLength(1);
    expect(offenders(`<cngx-meter\n  [value]="1"\n  [attr.aria-label]="x"\n/>`)).toHaveLength(1);
    // attribute selector, in any binding form
    expect(offenders(`<div cngxNamed [attr.aria-labelledby]="id"></div>`)).toHaveLength(1);
    expect(offenders(`<div [cngxNamed]="v" [attr.aria-labelledby]="id"></div>`)).toHaveLength(1);
    // `>` inside a binding does not end the tag early
    expect(offenders(`<cngx-meter [value]="a > b ? 1 : 0" [attr.aria-label]="x" />`)).toHaveLength(
      1,
    );

    // the correct input binding
    expect(offenders(`<cngx-meter [aria-label]="x" />`)).toEqual([]);
    expect(offenders(`<cngx-meter aria-label="static" />`)).toEqual([]);
    // an aria attribute the host does not alias
    expect(offenders(`<cngx-meter [attr.aria-describedby]="id" />`)).toEqual([]);
    // plain HTML and non-aliasing hosts
    expect(offenders(`<button [attr.aria-label]="x"></button>`)).toEqual([]);
    expect(offenders(`<cngx-plain [attr.aria-label]="x" />`)).toEqual([]);
    // a prefix of an aliased tag name is a different element
    expect(offenders(`<cngx-meter-legend [attr.aria-label]="x" />`)).toEqual([]);
    // an unterminated false start does not hide a later offender
    expect(
      offenders(`const x: Array<Foo "unbalanced;\n<cngx-meter [attr.aria-label]="x" />`),
    ).toHaveLength(1);
    // a child's binding is not the host's
    expect(offenders(`<cngx-meter><span [attr.aria-label]="x"></span></cngx-meter>`)).toEqual([]);
  });
});
