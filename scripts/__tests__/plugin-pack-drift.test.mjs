import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { computeDrift } from '../plugin-pack-drift.mjs';

const sha256 = (bytes) => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;

describe('computeDrift', () => {
  it('reports nothing when every recorded source hash still matches', () => {
    const disk = { 'a.json': 'content-a', 'b.story.ts': 'content-b' };
    const manifest = {
      sources: [
        { artifact: 'pack/theming-tokens.md', source: 'a.json', contentHash: sha256('content-a') },
        { artifact: 'pack/recipes/b.md', source: 'b.story.ts', contentHash: sha256('content-b') },
      ],
    };
    expect(computeDrift(manifest, (path) => disk[path] ?? null)).toEqual([]);
  });

  it('flags a source whose content hash has changed', () => {
    const manifest = {
      sources: [{ artifact: 'pack/recipes/b.md', source: 'b.story.ts', contentHash: sha256('old') }],
    };
    const drift = computeDrift(manifest, () => 'new');
    expect(drift).toHaveLength(1);
    expect(drift[0]).toMatchObject({ artifact: 'pack/recipes/b.md', reason: 'hash changed' });
  });

  it('flags a source that no longer exists', () => {
    const manifest = {
      sources: [{ artifact: 'pack/x.md', source: 'gone.json', contentHash: sha256('whatever') }],
    };
    const drift = computeDrift(manifest, () => null);
    expect(drift).toHaveLength(1);
    expect(drift[0].reason).toBe('source missing');
  });

  it('treats an empty manifest as in sync', () => {
    expect(computeDrift({ sources: [] }, () => null)).toEqual([]);
    expect(computeDrift({}, () => null)).toEqual([]);
  });
});
