/**
 * Guards the links from rendered prose to the error-code pages.
 *
 * Every `CNGXnnnn` a reader sees on the docs site links to its page in the
 * same docs version, so the link is never an absolute URL:
 *
 * - JSDoc under `projects/`: ``[`CNGXnnnn`](/error-codes/cngxnnnn.md)``.
 *   compodocx resolves a root-absolute `.md` link against the includes folder
 *   (`core-concepts`); a relative one is not resolved on pages built from
 *   several files and goes unreported.
 * - Markdown under `projects/` (READMEs and a symbol's neighbour `.md`): a
 *   relative link to `core-concepts/error-codes/cngxnnnn.md`, which also works
 *   on GitHub.
 * - `core-concepts/*.md`: a relative link to the generated page
 *   (`error-codes/cngxnnnn.html`), the form `core-concepts-links.test.mjs`
 *   checks for every link between core-concepts pages.
 *
 * Not checked: `@internal` JSDoc blocks (not rendered), fenced code, code
 * spans with more than the code (a command such as `cngx explain CNGX0001`),
 * `ARCHITECTURE.md` (not rendered) and the error-code pages themselves.
 * The compodocx `Markdown links:` warning reports a link without a page, but
 * not a bare code; this guard catches the bare code.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, posix, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { readSources } from '../error-codes-manifest.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const CORE_CONCEPTS = 'core-concepts';
const OUT_DIR = 'additional-documentation';

const CODE = /CNGX\d{4}/g;
const LINK = /\[`(CNGX\d{4})`\]\(([^)\s]+)\)/g;
const CODE_SPAN = /`[^`\n]+`/g;

/** Text with fenced code blocks blanked out, offsets kept. */
const withoutFences = (text) =>
  text.replace(/^[ \t]*(?:\*[ \t]*)?(```|~~~)[\s\S]*?^[ \t]*(?:\*[ \t]*)?\1/gm, (block) =>
    block.replace(/[^\n]/g, ' '),
  );

/**
 * The problems of the codes in `text`: each code must sit in a link whose
 * href `expectedHref(code)` accepts; a code inside a code span with other
 * text is left alone. Returns one message per problem.
 */
export function codeLinkProblems(text, expectedHref) {
  const prose = withoutFences(text);
  const covered = [];
  const problems = [];
  for (const match of prose.matchAll(LINK)) {
    const [whole, code, href] = match;
    covered.push([match.index, match.index + whole.length]);
    const expected = expectedHref(code);
    if (href !== expected) {
      problems.push(`${code} links to ${href}, expected ${expected}`);
    }
  }
  const inside = (index) => covered.some(([from, to]) => index >= from && index < to);
  for (const match of prose.matchAll(CODE_SPAN)) {
    if (!inside(match.index) && !/^`CNGX\d{4}`$/.test(match[0])) {
      covered.push([match.index, match.index + match[0].length]);
    }
  }
  for (const match of prose.matchAll(CODE)) {
    if (!inside(match.index)) {
      problems.push(`${match[0]} is not linked to its page`);
    }
  }
  return problems;
}

/** The `/** ... *\/` blocks of a TypeScript source that are not `@internal`. */
export function renderedJsdocBlocks(source) {
  return [...source.matchAll(/\/\*\*[\s\S]*?\*\//g)]
    .map((match) => match[0])
    .filter((block) => !/@internal\b/.test(block));
}

const pageOf = (code) => `${code.toLowerCase()}.md`;
const pageExists = (code) => existsSync(join(ROOT, CORE_CONCEPTS, 'error-codes', pageOf(code)));

function markdownFiles(dir) {
  return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules') {
      return [];
    }
    const path = posix.join(dir, entry.name);
    if (entry.isDirectory()) {
      return markdownFiles(path);
    }
    return entry.name.endsWith('.md') && entry.name !== 'ARCHITECTURE.md' ? [path] : [];
  });
}

/** compodocx page-name slug, as in `core-concepts-links.test.mjs`. */
const pageSlug = (title) => title.toLowerCase().trim().replace(/\s+/g, '-');

/** Output path of every core-concepts page, keyed by its file. */
function outputPaths(entries, parentDir = OUT_DIR, into = new Map()) {
  for (const entry of entries) {
    into.set(entry.file, posix.join(parentDir, `${pageSlug(entry.title)}.html`));
    if (entry.children) {
      outputPaths(entry.children, posix.join(parentDir, pageSlug(entry.title)), into);
    }
  }
  return into;
}

const read = (path) => readFileSync(join(ROOT, path), 'utf8');

describe('error-code link check', () => {
  const href = () => '/error-codes/cngx0006.md';

  it('accepts a linked code', () => {
    expect(codeLinkProblems('See [`CNGX0006`](/error-codes/cngx0006.md).', href)).toEqual([]);
  });

  it('reports a bare code and a code alone in a code span', () => {
    expect(codeLinkProblems('Warns CNGX0006 and `CNGX0006`.', href)).toEqual([
      'CNGX0006 is not linked to its page',
      'CNGX0006 is not linked to its page',
    ]);
  });

  it('reports a link to another target', () => {
    expect(codeLinkProblems('[`CNGX0006`](cngx0006.html)', href)).toEqual([
      'CNGX0006 links to cngx0006.html, expected /error-codes/cngx0006.md',
    ]);
  });

  it('leaves a command in a code span and fenced code alone', () => {
    const text = "Run `cngx explain CNGX0006`.\n\n```ts\ncngxDevWarn('CNGX0006');\n```\n";
    expect(codeLinkProblems(text, href)).toEqual([]);
  });

  it('leaves fenced code inside a JSDoc block alone', () => {
    const block = "/**\n * Example:\n * ```ts\n * cngxDevWarn('CNGX0006');\n * ```\n */";
    expect(codeLinkProblems(block, href)).toEqual([]);
  });

  it('skips @internal JSDoc blocks', () => {
    const source = '/** Warns CNGX0006. @internal */\nconst a = 1;\n/** Warns CNGX0007. */';
    expect(renderedJsdocBlocks(source)).toEqual(['/** Warns CNGX0007. */']);
  });
});

describe('error-code links in rendered prose', () => {
  it('links every code in rendered JSDoc root-absolute to its page', () => {
    const offenders = readSources().flatMap(({ path, text }) =>
      renderedJsdocBlocks(text).flatMap((block) =>
        codeLinkProblems(block, (code) => `/error-codes/${pageOf(code)}`).map(
          (problem) => `${path}: ${problem}`,
        ),
      ),
    );
    expect(offenders).toEqual([]);
  });

  it('links every code in Markdown under projects/ relative to its page', () => {
    const offenders = markdownFiles('projects').flatMap((path) => {
      const toPage = (code) =>
        relative(dirname(join(ROOT, path)), join(ROOT, CORE_CONCEPTS, 'error-codes', pageOf(code)))
          .split('\\')
          .join('/');
      return codeLinkProblems(read(path), toPage).map((problem) => `${path}: ${problem}`);
    });
    expect(offenders).toEqual([]);
  });

  it('links every code in core-concepts pages to the generated page', () => {
    const summary = JSON.parse(read(posix.join(CORE_CONCEPTS, 'summary.json')));
    const outputs = outputPaths(summary);
    const offenders = readdirSync(join(ROOT, CORE_CONCEPTS))
      .filter((name) => name.endsWith('.md'))
      .flatMap((name) => {
        const out = outputs.get(name);
        if (!out) {
          return [];
        }
        const toPage = (code) =>
          posix.relative(
            posix.dirname(out),
            posix.join(OUT_DIR, 'error-codes', `${code.toLowerCase()}.html`),
          );
        return codeLinkProblems(read(posix.join(CORE_CONCEPTS, name)), toPage).map(
          (problem) => `${CORE_CONCEPTS}/${name}: ${problem}`,
        );
      });
    expect(offenders).toEqual([]);
  });

  it('links only to codes that have a page', () => {
    const linked = [
      ...readSources().flatMap(({ text }) => renderedJsdocBlocks(text)),
      ...markdownFiles('projects').map(read),
      ...readdirSync(join(ROOT, CORE_CONCEPTS))
        .filter((name) => name.endsWith('.md'))
        .map((name) => read(posix.join(CORE_CONCEPTS, name))),
    ].flatMap((text) => [...text.matchAll(LINK)].map((match) => match[1]));
    expect([...new Set(linked)].filter((code) => !pageExists(code))).toEqual([]);
  });
});
