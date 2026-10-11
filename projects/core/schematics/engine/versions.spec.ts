import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_ESLINT_PLUGIN_VERSION,
  DEFAULT_MCP_VERSION,
  parseVersions,
  type ReadText,
  resolveVersions,
} from './versions';

const PUBLISHED = JSON.stringify({ cngx: '0.1.0', mcp: '0.3.0', eslintPlugin: '0.2.1', angular: '^21.2.0' });

describe('parseVersions', () => {
  it('reads the three pins and ignores the rest', () => {
    expect(parseVersions(PUBLISHED)).toEqual({ cngx: '0.1.0', mcp: '0.3.0', eslintPlugin: '0.2.1' });
  });

  it('rejects a body with a missing pin', () => {
    expect(parseVersions(JSON.stringify({ cngx: '0.1.0', mcp: '0.3.0' }))).toBeUndefined();
    expect(parseVersions('[]')).toBeUndefined();
    expect(parseVersions('{ not json')).toBeUndefined();
  });
});

describe('resolveVersions', () => {
  let pkg: string;
  let bundleDir: string;

  beforeEach(() => {
    pkg = mkdtempSync(join(tmpdir(), 'cngx-versions-'));
    bundleDir = join(pkg, 'schematics', 'ng-add');
    mkdirSync(bundleDir, { recursive: true });
    writeFileSync(join(pkg, 'package.json'), JSON.stringify({ version: '0.1.0-rc.9' }));
  });

  afterEach(() => {
    rmSync(pkg, { recursive: true, force: true });
  });

  it('reads versions.json next to the bundles', () => {
    const paths: string[] = [];
    const read: ReadText = (path) => {
      paths.push(path);
      return PUBLISHED;
    };

    expect(resolveVersions(bundleDir, read)).toEqual({
      versions: { cngx: '0.1.0', mcp: '0.3.0', eslintPlugin: '0.2.1' },
    });
    expect(paths).toEqual([join(pkg, 'schematics', 'versions.json')]);
  });

  it('falls back to the own version and the defaults, and says so', () => {
    const resolved = resolveVersions(bundleDir, () => undefined);

    expect(resolved.versions).toEqual({
      cngx: '0.1.0-rc.9',
      mcp: DEFAULT_MCP_VERSION,
      eslintPlugin: DEFAULT_ESLINT_PLUGIN_VERSION,
    });
    expect(resolved.warning).toContain('a local build');
  });

  it('reads the real file from disk by default', () => {
    writeFileSync(join(pkg, 'schematics', 'versions.json'), PUBLISHED);

    expect(resolveVersions(bundleDir).versions.mcp).toBe('0.3.0');
  });

  it('keeps the defaults in step with the packages they pin', () => {
    const version = (name: string): string =>
      (JSON.parse(readFileSync(join(__dirname, '../../../../packages', name, 'package.json'), 'utf8')) as { version: string })
        .version;

    expect(DEFAULT_MCP_VERSION).toBe(version('mcp'));
    expect(DEFAULT_ESLINT_PLUGIN_VERSION).toBe(version('eslint-plugin'));
  });
});
