/**
 * Guards the relative links inside the library READMEs.
 *
 * The READMEs ship to npm and render on GitHub, where a relative link that
 * points at a moved or never-written file 404s silently. This test resolves
 * every relative link in `projects/**\/README.md` against the README's own
 * directory (a leading `/` resolves against the repo root, as on GitHub)
 * and, when the link carries a `#anchor` into a markdown file, checks the
 * anchor against that file's GitHub heading ids.
 *
 * Absolute URLs (`https:`, `mailto:`), in-page links without a path and links
 * inside fenced code blocks are out of scope.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PROJECTS = join(ROOT, 'projects');
const DOCS_SITE = 'https://cngxjs.github.io/cngx/';
const GITHUB_BLOB = 'https://github.com/cngxjs/cngx/blob/main/';
/** Folders whose READMEs belong to no docs page (internal select spine). */
const NO_DOCS_PAGE = ['projects/forms/select/shared/internal/'];

function readmes(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (name === 'node_modules' || name.startsWith('.')) {
      return [];
    }
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      return readmes(path);
    }
    return name.toLowerCase() === 'readme.md' ? [path] : [];
  });
}

/** Markdown with fenced code blocks blanked out, so sample links inside them are ignored. */
const withoutFences = (md) => md.replace(/^(```|~~~)[\s\S]*?^\1/gm, '');

/**
 * GitHub heading-id slug: inline code ticks and link targets drop, the text is
 * lowercased, everything except letters, digits, `_`, `-` and spaces drops,
 * and each space becomes one `-` (runs are not collapsed). A repeated heading
 * gets `-1`, `-2`, ... appended.
 */
const headingSlug = (text) =>
  text
    .replace(/`/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_\s-]/gu, '')
    .trim()
    .replace(/\s/g, '-');

function headingIds(md) {
  const ids = new Set();
  const seen = new Map();
  for (const match of withoutFences(md).matchAll(/^#{1,6}\s+(.+?)\s*#*$/gm)) {
    const base = headingSlug(match[1]);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    ids.add(count === 0 ? base : `${base}-${count}`);
  }
  return ids;
}

const links = (md) =>
  [...withoutFences(md).matchAll(/\]\(<?([^)\s>]+)>?(?:\s+"[^"]*")?\)/g)].map((m) => m[1]);

const isExternal = (href) => /^[a-z][a-z0-9+.-]*:/i.test(href);

function brokenLinks(file) {
  const md = readFileSync(file, 'utf8');
  const offenders = [];
  for (const href of links(md)) {
    if (isExternal(href) || href.startsWith('#')) {
      continue;
    }
    const [path, anchor] = href.split('#');
    const target = path.startsWith('/')
      ? join(ROOT, decodeURI(path))
      : resolve(dirname(file), decodeURI(path));
    const where = `${relative(ROOT, file)}: ${href}`;
    if (!existsSync(target)) {
      offenders.push(`${where} (no file ${relative(ROOT, target)})`);
      continue;
    }
    if (anchor && target.endsWith('.md') && !headingIds(readFileSync(target, 'utf8')).has(anchor)) {
      offenders.push(`${where} (no heading with that id in ${relative(ROOT, target)})`);
    }
  }
  return offenders;
}

const README_FILES = readmes(PROJECTS);

describe('README relative links', () => {
  it('finds the library READMEs', () => {
    expect(README_FILES.length).toBeGreaterThan(0);
  });

  it('resolves every relative link and anchor to a file and heading', () => {
    expect(README_FILES.flatMap(brokenLinks)).toEqual([]);
  });

  it('links additional pages relative to their Markdown source', () => {
    // An absolute URL into the docs site pins the reader to one docs version;
    // a relative `.md` link works on GitHub and stays in the version on the site.
    const fixed = README_FILES.flatMap((file) =>
      links(readFileSync(file, 'utf8'))
        .filter((href) => href.startsWith(`${DOCS_SITE}additional-documentation/`))
        .map((href) => `${relative(ROOT, file)}: ${href}`),
    );
    expect(fixed).toEqual([]);
  });

  it('links the docs start page through the root README, never by its fixed URL', () => {
    // The docs site renders the root README.md as its start page. The fixed
    // URL opens the newest release from any version; the relative link stays
    // in the version being read and opens the repository README on GitHub.
    const root = new RegExp(`${DOCS_SITE.replaceAll('.', '\\.')}?(?=[)\\s]|$)`, 'gm');
    const fixed = README_FILES.flatMap((file) =>
      [...withoutFences(readFileSync(file, 'utf8')).matchAll(root)].map(
        () => `${relative(ROOT, file)}: link ${relative(dirname(file), join(ROOT, 'README.md'))}`,
      ),
    );
    expect(fixed).toEqual([]);
  });

  it('links only Markdown the docs build renders as a page', () => {
    // compodocx gives a README (the root one is the start page) and a
    // core-concepts file a page; any other Markdown file (ARCHITECTURE.md, a
    // migration note) and the READMEs under NO_DOCS_PAGE have none, so a
    // relative link to one is dead on the docs site. Link those through
    // GitHub (`GITHUB_BLOB`) instead. A README without a page of its own is
    // only read on GitHub and may link anything there.
    const noPage = (path) => NO_DOCS_PAGE.some((dir) => path.startsWith(dir));
    const rendered = (path) =>
      !noPage(path) &&
      (path === 'README.md' || path.endsWith('/README.md') || path.startsWith('core-concepts/'));
    const offenders = README_FILES.filter((file) => !noPage(relative(ROOT, file))).flatMap(
      (file) =>
        links(readFileSync(file, 'utf8'))
          .filter((href) => !isExternal(href) && !href.startsWith('#'))
          .map((href) => relative(ROOT, resolve(dirname(file), decodeURI(href.split('#')[0]))))
          .filter((target) => target.endsWith('.md') && !rendered(target))
          .map((target) => `${relative(ROOT, file)}: ${target}, link ${GITHUB_BLOB}${target}`),
    );
    expect(offenders).toEqual([]);
  });

  it('links folders only where the docs build has a feature page for them', () => {
    // On a feature page compodocx rewrites a link without `.md` to the page
    // of the feature whose folder (`semantic.features[].root`) or README
    // folder it names and drops any other one to plain text.
    const features = JSON.parse(readFileSync(join(ROOT, '.compodoc/documentation.json'), 'utf8'))
      .semantic.features;
    const rendered = features.map((f) => f.readme).filter(Boolean);
    const folders = new Set([
      ...features.map((f) => f.root),
      ...rendered.map((file) => dirname(file)),
    ]);
    const offenders = rendered.flatMap((file) =>
      links(readFileSync(join(ROOT, file), 'utf8'))
        .filter((href) => !isExternal(href) && !href.startsWith('#'))
        .map((href) => decodeURI(href.split('#')[0]))
        .filter((path) => !/\.md$/i.test(path))
        .map((path) => ({
          path,
          target: relative(
            ROOT,
            path.startsWith('/') ? join(ROOT, path) : join(ROOT, dirname(file), path),
          ),
        }))
        .filter(({ target }) => !folders.has(target))
        .map(({ path, target }) => `${file}: ${path} (no feature page for ${target})`),
    );
    expect(offenders).toEqual([]);
  });

  it('links the API of a rendered README to its own feature page on the docs site', () => {
    // The URL opens the page on GitHub and npm; `siteUrl` in .compodocrc.json
    // keeps it in the version being read on the docs site. The page path is
    // the entry point below `@cngx/` (if any) plus the feature key. A README
    // without a page keeps the relative link to the start page.
    const features = JSON.parse(
      readFileSync(join(ROOT, '.compodoc/documentation.json'), 'utf8'),
    ).semantic.features.filter((f) => f.readme);
    const offenders = features.flatMap((f) => {
      const page = [f.entryPoint?.replace(/^@cngx\//, ''), f.key].filter(Boolean).join('/');
      const expected = `${DOCS_SITE}main/${page}/`;
      return [
        ...withoutFences(readFileSync(join(ROOT, f.readme), 'utf8')).matchAll(
          /\[(?:API on compodocx|compodocx API documentation)\]\(([^)\s]+)\)/g,
        ),
      ]
        .filter((m) => m[1] !== expected)
        .map((m) => `${f.readme}: ${m[1]}, link ${expected}`);
    });
    expect(offenders).toEqual([]);
  });

  it('slugs headings the way GitHub renders them', () => {
    expect(headingSlug('`model<T>()` for two-way bindable atoms')).toBe(
      'modelt-for-two-way-bindable-atoms',
    );
    expect(headingSlug('Forms integration')).toBe('forms-integration');
    expect(headingSlug('A - B')).toBe('a---b');
    expect(headingSlug('See [`CngxSelect`](./x.md)')).toBe('see-cngxselect');
    const ids = headingIds('# Usage\n\n## Usage\n\n```md\n# Ignored\n```\n');
    expect([...ids]).toEqual(['usage', 'usage-1']);
  });
});
