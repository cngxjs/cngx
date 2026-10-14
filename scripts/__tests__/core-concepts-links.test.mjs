/**
 * Guards the cross-links between core-concepts pages.
 *
 * compodocx copies a markdown href verbatim and names each generated page
 * after its summary.json title, not after its file: three-pillars.md becomes
 * additional-documentation/the-three-pillars.html, a child page lands under
 * its parent's title slug. A `[x](three-pillars.md)` link therefore 404s on the
 * docs site while looking fine in the editor. This test resolves every
 * relative link against the output paths compodocx produces and checks the
 * anchor against the target's heading ids, without needing a docs build.
 *
 * 1. Every page in summary.json exists on disk.
 * 2. No page links another file by its .md name.
 * 3. Every relative .html link inside additional-documentation/ names a
 *    generated page, and its #anchor names a heading on that page.
 *
 * Links that leave additional-documentation/ (API pages such as
 * ../injectables/X.html) are generated from source and out of scope here.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const CORE_CONCEPTS = join(ROOT, 'core-concepts');
const OUT_DIR = 'additional-documentation';

/** compodocx page-name slug: lowercase, whitespace runs to `-`, everything else kept. */
const pageSlug = (title) => title.toLowerCase().trim().replace(/\s+/g, '-');

/**
 * compodocx heading-id slug. It slugs the rendered HTML, so `<T>` arrives as
 * `&lt;T&gt;` and becomes `lttgt` (a `"` becomes `quot`); markup and
 * punctuation other than `_` drop, runs of spaces and dashes collapse to one
 * dash. Duplicate headings are not suffixed.
 */
const headingSlug = (text) =>
  text
    .replace(/`/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .toLowerCase()
    .replace(/[^a-z0-9_\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-');

/** Markdown with fenced code blocks blanked out, so sample links inside them are ignored. */
const withoutFences = (md) => md.replace(/^(```|~~~)[\s\S]*?^\1/gm, '');

const headingIds = (md) =>
  new Set([...withoutFences(md).matchAll(/^#{1,6}\s+(.+?)\s*#*$/gm)].map((m) => headingSlug(m[1])));

const links = (md) => [...withoutFences(md).matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]);

/** Flatten summary.json into { file, out } rows, `out` relative to the docs root. */
function pages(entries, parentDir = OUT_DIR) {
  return entries.flatMap((entry) => {
    const out = posix.join(parentDir, `${pageSlug(entry.title)}.html`);
    const children = entry.children
      ? pages(entry.children, posix.join(parentDir, pageSlug(entry.title)))
      : [];
    return [{ file: entry.file, out }, ...children];
  });
}

const summary = JSON.parse(readFileSync(join(CORE_CONCEPTS, 'summary.json'), 'utf8'));
const PAGES = pages(summary);
const read = (file) => readFileSync(join(CORE_CONCEPTS, file), 'utf8');
const byOut = new Map(PAGES.map((page) => [page.out, page]));

describe('core-concepts cross-links', () => {
  it('lists only pages that exist on disk', () => {
    expect(PAGES.length).toBeGreaterThan(0);
    for (const { file } of PAGES) {
      expect(
        existsSync(join(CORE_CONCEPTS, file)),
        `summary.json names a missing file: ${file}`,
      ).toBe(true);
    }
  });

  it('never links another page by its .md name', () => {
    const offenders = PAGES.flatMap(({ file }) =>
      links(read(file))
        .filter((href) => !/^[a-z]+:/i.test(href) && /\.md(#|$)/.test(href))
        .map((href) => `${file}: ${href}`),
    );
    expect(
      offenders,
      'link the generated .html page instead (named after the summary.json title)',
    ).toEqual([]);
  });

  it('resolves every relative .html link and anchor to a generated page and heading', () => {
    const offenders = [];
    for (const { file, out } of PAGES) {
      const own = read(file);
      for (const href of links(own)) {
        if (/^[a-z]+:/i.test(href)) {
          continue;
        }
        const [path, anchor] = href.split('#');
        if (path === '') {
          if (anchor && !headingIds(own).has(anchor)) {
            offenders.push(`${file}: ${href} (no heading with that id)`);
          }
          continue;
        }
        if (!path.endsWith('.html')) {
          continue;
        }
        const target = posix.normalize(posix.join(posix.dirname(out), path));
        if (!target.startsWith(`${OUT_DIR}/`)) {
          continue;
        }
        const page = byOut.get(target);
        if (!page) {
          offenders.push(`${file}: ${href} (no generated page ${target})`);
          continue;
        }
        if (anchor && !headingIds(read(page.file)).has(anchor)) {
          offenders.push(`${file}: ${href} (no heading with that id on ${page.file})`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('slugs headings the way compodocx renders them', () => {
    expect(headingSlug('`model<T>()` for two-way bindable atoms')).toBe(
      'modellttgt-for-two-way-bindable-atoms',
    );
    expect(headingSlug('1. Ableitung statt Verwaltung - Derivation over Management')).toBe(
      '1-ableitung-statt-verwaltung-derivation-over-management',
    );
    expect(headingSlug('Relation to `@cngx/doctor`')).toBe('relation-to-cngxdoctor');
    expect(headingSlug('The CNGX_LOADING_CONFIG cascade')).toBe('the-cngx_loading_config-cascade');
    expect(headingSlug('3. The Consumer Story: "The Trojan Horse"')).toBe(
      '3-the-consumer-story-quotthe-trojan-horsequot',
    );
    expect(pageSlug('Store Bridges & Async Observability')).toBe(
      'store-bridges-&-async-observability',
    );
  });
});
