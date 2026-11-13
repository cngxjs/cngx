import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * Guard for fake JSDoc block tags in the compodocx JSON export. TypeScript,
 * and so compodocx, reads every `@word` after whitespace in a JSDoc comment
 * as a block tag, mid-line too: the description ends there and the word
 * shows up as a tag in `jsdoctags` ("### With @switch" yields `switch`,
 * "(from @cngx/ui)" yields `cngx`). The rendered page loses the rest of the
 * prose and lists a tag that does not exist.
 *
 * Scope: every `jsdoctags` array anywhere in `.compodoc/documentation.json`
 * (classes, members, functions, tokens, ...). Each tag name must be in
 * {@link KNOWN_TAGS}. A fake tag is fixed at its source: write the word as
 * inline code (`` `@word` ``), or move an Angular template or decorator
 * example into a fenced block. A genuinely new real tag goes into the list.
 *
 * Needs a fresh `.compodoc/documentation.json`; CI builds it before
 * `test:scripts`.
 */

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const DOC_PATH = resolve(REPO_ROOT, '.compodoc/documentation.json');

/**
 * Real block tags. Exact; a new row is a tag compodocx or TSDoc defines, never
 * a word that leaked from prose.
 */
export const KNOWN_TAGS = new Set([
  // JSDoc / TSDoc standard tags.
  'param',
  'returns',
  'typeParam',
  'example',
  'see',
  'remarks',
  'deprecated',
  'default',
  'defaultValue',
  'since',
  // Standard tags the repo writes on symbols compodocx drops today (`@internal`
  // members, the `@module` header of a public-api.ts, `@throws` on an internal
  // factory); listed so a public symbol carrying one does not fail.
  'internal',
  'module',
  'throws',
  // compodocx tags.
  'github',
  'relatedTo',
  'wcag',
  'axis',
  'slot',
  'playground',
  'selector',
]);

function loadExport() {
  if (!existsSync(DOC_PATH)) throw new Error('run npm run docs:json first');
  const exported = JSON.parse(readFileSync(DOC_PATH, 'utf8'));
  if (exported.schemaVersion !== 7) throw new Error('schemaVersion 7 expected');
  const installed = JSON.parse(
    readFileSync(resolve(REPO_ROOT, 'node_modules/@cngxjs/compodocx/package.json'), 'utf8'),
  ).version;
  if (exported.compodocxVersion !== installed) {
    throw new Error('stale docs JSON: regenerate with npm run docs:json');
  }
  return exported;
}

/** Tag name of one `jsdoctags` entry; `undefined` for a comment-only entry. */
function tagNameOf(entry) {
  return entry?.tagName?.text ?? entry?.tagName?.escapedText;
}

/**
 * The owner a node describes: a node with its own `file` starts a new owner
 * (class, function, token), a named node without one is a member of the
 * enclosing owner.
 */
function ownerOf(node, parent) {
  if (typeof node.name !== 'string') return parent;
  if (typeof node.file === 'string') return { file: node.file, symbol: node.name };
  const symbol = parent.symbol ? `${parent.symbol}.${node.name}` : node.name;
  return { file: parent.file, symbol };
}

/**
 * Every `jsdoctags` entry anywhere in the export, with the file and symbol
 * that carry it. Entries without a tag name are the description-only rows
 * compodocx adds for a tagless class JSDoc; they hold no tag and are skipped.
 *
 * @param {unknown} exported
 */
export function collectJsdocTags(exported) {
  const tags = [];
  const walk = (node, parent) => {
    if (Array.isArray(node)) {
      for (const item of node) walk(item, parent);
      return;
    }
    if (!node || typeof node !== 'object') return;
    const owner = ownerOf(node, parent);
    for (const entry of Array.isArray(node.jsdoctags) ? node.jsdoctags : []) {
      const tag = tagNameOf(entry);
      if (tag !== undefined) tags.push({ tag, file: owner.file, symbol: owner.symbol });
    }
    for (const [key, value] of Object.entries(node)) {
      if (key !== 'jsdoctags') walk(value, owner);
    }
  };
  walk(exported, { file: undefined, symbol: undefined });
  return tags;
}

/**
 * Tags whose name is not in `known`.
 *
 * @param {{ tag: string, file?: string, symbol?: string }[]} tags
 * @param {Set<string>} [known]
 */
export function unknownTags(tags, known = KNOWN_TAGS) {
  return tags.filter((row) => !known.has(row.tag));
}

const describeRow = (row) => `@${row.tag} in ${row.file ?? '?'} (${row.symbol ?? '?'})`;

const FIX =
  'a `@word` in JSDoc prose is read as a block tag: write it as inline code (`@word`), ' +
  'put Angular templates and decorator examples in a fenced block, ' +
  'or add a genuinely new real tag to KNOWN_TAGS';

describe('jsdoc tag names (repo)', () => {
  const tags = collectJsdocTags(loadExport());

  it('finds the jsdoctags', () => {
    expect(tags.length).toBeGreaterThan(1000);
  });

  it('uses only real block tags', () => {
    expect(unknownTags(tags).map(describeRow), FIX).toEqual([]);
  });
});

describe('jsdoc tag names (scanner fixtures)', () => {
  const tag = (text) => ({ tagName: { text } });

  it('collects tags at every depth with file and symbol', () => {
    const tags = collectJsdocTags({
      components: [
        {
          name: 'CngxHost',
          file: 'projects/x/host.ts',
          jsdoctags: [tag('since')],
          inputsClass: [{ name: 'value', jsdoctags: [tag('switch')] }],
        },
      ],
      miscellaneous: {
        functions: [{ name: 'fn', file: 'projects/x/fn.ts', jsdoctags: [tag('cngx')] }],
      },
    });
    expect(tags).toEqual([
      { tag: 'since', file: 'projects/x/host.ts', symbol: 'CngxHost' },
      { tag: 'switch', file: 'projects/x/host.ts', symbol: 'CngxHost.value' },
      { tag: 'cngx', file: 'projects/x/fn.ts', symbol: 'fn' },
    ]);
  });

  it('skips a comment-only entry without a tag name', () => {
    const tags = collectJsdocTags({ name: 'X', file: 'a.ts', jsdoctags: [{ comment: 'Body.' }] });
    expect(tags).toEqual([]);
  });

  it('reads escapedText when text is absent', () => {
    const tags = collectJsdocTags({
      name: 'X',
      file: 'a.ts',
      jsdoctags: [{ tagName: { escapedText: 'param' } }],
    });
    expect(tags.map((row) => row.tag)).toEqual(['param']);
  });

  it('reports a fake tag and keeps the real ones', () => {
    const rows = unknownTags([
      { tag: 'param', file: 'a.ts', symbol: 'A' },
      { tag: 'switch', file: 'a.ts', symbol: 'A.b' },
    ]);
    expect(rows.map(describeRow)).toEqual(['@switch in a.ts (A.b)']);
  });
});
