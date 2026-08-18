import { describe, expect, it } from 'vitest';

import {
  collectThemeTokens,
  computeSourceHash,
  renderTokenReference,
  upsertManifestEntry,
} from '../plugin-token-reference.mjs';

const DOC = {
  components: [
    {
      name: 'CngxBadge',
      category: 'common/display',
      themeTokens: [
        {
          name: '--cngx-badge-bg',
          kind: 'css-custom-property',
          defaultValue: 'currentColor',
          group: 'Surface',
          description: 'Badge background.\nSecond line is dropped.',
          file: '/Users/someone/repo/projects/common/display/badge.css',
          line: 10,
        },
      ],
    },
  ],
  directives: [{ name: 'CngxRipple', category: 'common/interactive', themeTokens: [] }],
};

describe('collectThemeTokens', () => {
  const groups = collectThemeTokens(DOC);

  it('keeps only artifacts that declare at least one token', () => {
    expect(groups).toHaveLength(1);
    expect(groups[0].component).toBe('CngxBadge');
  });

  it('reduces each token to name/default/group and the first description line only', () => {
    expect(groups[0].tokens[0]).toEqual({
      name: '--cngx-badge-bg',
      default: 'currentColor',
      group: 'Surface',
      description: 'Badge background.',
    });
  });
});

describe('renderTokenReference', () => {
  const md = renderTokenReference(DOC);

  it('renders a dense table row with token, default and group', () => {
    expect(md).toContain('## CngxBadge');
    expect(md).toContain('|-|-|-|-|');
    expect(md).toContain('|`--cngx-badge-bg`|`currentColor`|Surface|Badge background.|');
  });

  it('leaks no absolute source path from the token file field', () => {
    expect(md).not.toMatch(/\/Users\//);
  });
});

describe('provenance helpers', () => {
  it('hashes deterministically with a sha256 prefix', () => {
    expect(computeSourceHash('abc')).toBe(computeSourceHash('abc'));
    expect(computeSourceHash('abc')).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it('upserts a manifest entry by artifact key', () => {
    const start = { schemaVersion: '1', sources: [] };
    const once = upsertManifestEntry(start, { artifact: 'pack/theming-tokens.md', contentHash: 'h1' });
    const twice = upsertManifestEntry(once, { artifact: 'pack/theming-tokens.md', contentHash: 'h2' });
    expect(twice.sources).toHaveLength(1);
    expect(twice.sources[0].contentHash).toBe('h2');
  });
});
