import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import {
  ERROR_CODE_ASSET,
  buildErrorCodeBlock,
  dedupeMessageTexts,
  llmDumpPresent,
  parseSnapshotArgs,
  rebaseExampleUrls,
  rebaseUrl,
  stripPageBody,
} from '../mcp-snapshot.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const DOCS_BASE = 'https://cngxjs.github.io/cngx/additional-documentation/error-codes/';

const BASE = 'https://cngxjs.github.io/cngx/examples';
const LOCAL = 'http://localhost:4200/#/ui/feedback/toast/basic';

describe('ERROR_CODE_ASSET', () => {
  it('sits under .compodoc and under neither published data directory', () => {
    expect(relative(ROOT, ERROR_CODE_ASSET)).toBe(join('.compodoc', 'error-codes.json'));
    expect(ERROR_CODE_ASSET.startsWith(join(ROOT, 'packages', 'mcp', 'data'))).toBe(false);
    expect(ERROR_CODE_ASSET.startsWith(join(ROOT, 'packages', 'cli', 'data'))).toBe(false);
  });
});

describe('rebaseUrl', () => {
  it('swaps everything before the hash route for the base', () => {
    expect(rebaseUrl(LOCAL, BASE)).toBe(`${BASE}/#/ui/feedback/toast/basic`);
  });

  it('puts a relative hash route under the base', () => {
    expect(rebaseUrl('/#/ui/feedback/toast/basic', BASE)).toBe(`${BASE}/#/ui/feedback/toast/basic`);
  });

  it('leaves a URL without a hash route alone', () => {
    expect(rebaseUrl('http://localhost:4200/plain', BASE)).toBe('http://localhost:4200/plain');
  });
});

describe('rebaseExampleUrls', () => {
  it('rebases components, directives and injectables and counts the changes', () => {
    const doc = {
      components: [{ name: 'CngxSelect', exampleUrls: [LOCAL] }],
      directives: [{ name: 'CngxRipple', exampleUrls: [`${BASE}/#/already`] }],
      injectables: [{ name: 'CngxToaster', exampleUrls: [LOCAL] }],
    };

    expect(rebaseExampleUrls(doc, BASE)).toBe(2);
    expect(doc.injectables[0].exampleUrls).toEqual([`${BASE}/#/ui/feedback/toast/basic`]);
    expect(doc.components[0].exampleUrls).toEqual([`${BASE}/#/ui/feedback/toast/basic`]);
  });
});

describe('parseSnapshotArgs', () => {
  it('stamps the root version and the GH Pages base by default', () => {
    expect(parseSnapshotArgs([], '0.1.0-rc.9')).toEqual({
      baseUrl: BASE,
      cngxVersion: '0.1.0-rc.9',
      requireLlmDump: false,
    });
  });

  it('stamps an explicit release version over the root version', () => {
    expect(parseSnapshotArgs(['--cngx-version=0.3.0'], '0.1.0-rc.9').cngxVersion).toBe('0.3.0');
    expect(parseSnapshotArgs(['--cngx-version=0.3.0-rc.1'], '0.1.0-rc.9').cngxVersion).toBe('0.3.0-rc.1');
  });

  it('refuses a malformed release version', () => {
    expect(() => parseSnapshotArgs(['--cngx-version=0.3'], '0.1.0-rc.9')).toThrow(/--cngx-version "0.3"/);
    expect(() => parseSnapshotArgs(['--cngx-version='], '0.1.0-rc.9')).toThrow(/not a well-formed semver/);
  });

  it('reads --require-llm-dump and the base precedence', () => {
    const options = parseSnapshotArgs(['--require-llm-dump', '--base=https://x.test/ex/'], '0.1.0', {
      EXAMPLES_BASE_URL: 'https://env.test',
    });
    expect(options.requireLlmDump).toBe(true);
    expect(options.baseUrl).toBe('https://x.test/ex');
    expect(parseSnapshotArgs([], '0.1.0', { EXAMPLES_BASE_URL: 'https://env.test/' }).baseUrl).toBe('https://env.test');
  });
});

describe('dedupeMessageTexts', () => {
  it('keeps each distinct text once in first-seen order, dropping file', () => {
    const messages = [
      { file: 'a.ts', text: 'same text' },
      { file: 'b.ts', text: 'same text' },
      { file: 'c.ts', text: 'other text' },
    ];

    expect(dedupeMessageTexts(messages)).toEqual(['same text', 'other text']);
  });

  it('is empty when there are no messages', () => {
    expect(dedupeMessageTexts(undefined)).toEqual([]);
  });
});

describe('stripPageBody', () => {
  it('drops the @aiGenerated marker and the # CNGXnnnn heading, keeping the ## title', () => {
    const raw = '<!-- @aiGenerated Claude -->\n\n# CNGX0001\n\n## Locale is not a BCP 47 tag\n\nBody text.\n';

    expect(stripPageBody(raw, DOCS_BASE)).toBe('## Locale is not a BCP 47 tag\n\nBody text.');
  });

  it('rewrites a relative cngxNNNN.html link and keeps an absolute one', () => {
    const raw = '# CNGX0001\n\nSee [CNGX0002](cngx0002.html) and [live](https://example.com/cngx0003.html).';

    const body = stripPageBody(raw, DOCS_BASE);
    expect(body).toContain(`[CNGX0002](${DOCS_BASE}cngx0002.html)`);
    expect(body).toContain('[live](https://example.com/cngx0003.html)');
  });

  it('equals the trimmed rest of the page', () => {
    const raw = '<!-- @aiGenerated Claude -->\n\n# CNGX0009\n\n## Title\n\nProse only.\n';

    expect(stripPageBody(raw, DOCS_BASE)).toBe('## Title\n\nProse only.');
  });
});

describe('buildErrorCodeBlock', () => {
  it('copies schemaVersion/docsBaseUrl/ranges, dedupes messages, drops files and page, carries the body', () => {
    const manifest = {
      schemaVersion: 3,
      docsBaseUrl: 'https://docs.test/error-codes/',
      ranges: [{ lib: 'core', from: 1, to: 899 }],
      codes: [
        {
          code: 'CNGX0001',
          lib: 'core',
          severity: 'warn',
          production: 'stripped',
          title: 'Title one',
          page: 'core-concepts/error-codes/cngx0001.md',
          url: 'https://docs.test/error-codes/cngx0001.html',
          status: 'active',
          files: ['projects/core/x.ts'],
          messages: [
            { file: 'projects/core/x.ts', text: 'dup' },
            { file: 'projects/core/y.ts', text: 'dup' },
          ],
        },
      ],
    };
    const pages = {
      'core-concepts/error-codes/cngx0001.md': '<!-- @aiGenerated Claude -->\n\n# CNGX0001\n\n## Title one\n\nBody.\n',
    };

    const block = buildErrorCodeBlock(manifest, (page) => pages[page]);

    expect(block.schemaVersion).toBe(3);
    expect(block.docsBaseUrl).toBe('https://docs.test/error-codes/');
    expect(block.ranges).toEqual([{ lib: 'core', from: 1, to: 899 }]);
    expect(block.codes).toHaveLength(1);

    const [entry] = block.codes;
    expect(entry).toEqual({
      code: 'CNGX0001',
      lib: 'core',
      severity: 'warn',
      production: 'stripped',
      title: 'Title one',
      status: 'active',
      url: 'https://docs.test/error-codes/cngx0001.html',
      messages: ['dup'],
      body: '## Title one\n\nBody.',
    });
    expect(entry).not.toHaveProperty('files');
    expect(entry).not.toHaveProperty('page');
  });

  it('builds a non-empty, marker-free body for every code over the real manifest', () => {
    const manifest = JSON.parse(readFileSync(join(ROOT, 'scripts/manifests/error-codes.json'), 'utf8'));

    const block = buildErrorCodeBlock(manifest, (page) => readFileSync(join(ROOT, page), 'utf8'));

    expect(block.codes).toHaveLength(manifest.codes.length);
    for (const entry of block.codes) {
      expect(entry.body.length, `${entry.code} body`).toBeGreaterThan(0);
      expect(entry.body).not.toContain('@aiGenerated');
      expect(entry.body).not.toMatch(/^# CNGX\d{4}/m);
    }
  });
});

describe('llmDumpPresent', () => {
  let dir;

  afterEach(() => {
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
      dir = undefined;
    }
  });

  it('copies a dump that is there, required or not', () => {
    dir = mkdtempSync(join(tmpdir(), 'mcp-snapshot-'));
    const source = join(dir, 'llm-context.md');
    writeFileSync(source, '# dump');
    expect(llmDumpPresent(source, false)).toBe(true);
    expect(llmDumpPresent(source, true)).toBe(true);
  });

  it('skips a missing dump in the dev build', () => {
    dir = mkdtempSync(join(tmpdir(), 'mcp-snapshot-'));
    expect(llmDumpPresent(join(dir, 'llm-context.md'), false)).toBe(false);
  });

  it('fails on a missing dump under --require-llm-dump, naming npm run docs:llm', () => {
    dir = mkdtempSync(join(tmpdir(), 'mcp-snapshot-'));
    expect(() => llmDumpPresent(join(dir, 'llm-context.md'), true)).toThrow(/npm run docs:llm/);
  });
});
