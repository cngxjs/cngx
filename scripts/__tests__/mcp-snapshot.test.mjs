import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { llmDumpPresent, parseSnapshotArgs, rebaseExampleUrls, rebaseUrl } from '../mcp-snapshot.mjs';

const BASE = 'https://cngxjs.github.io/cngx/examples';
const LOCAL = 'http://localhost:4200/#/ui/feedback/toast/basic';

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
