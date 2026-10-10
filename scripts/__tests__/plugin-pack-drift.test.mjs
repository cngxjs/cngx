import { describe, expect, it } from 'vitest';

import { computeCoverage, computeDrift } from '../plugin-pack-drift.mjs';
import { computeSourceHash } from '../plugin-token-reference.mjs';

const sha256 = computeSourceHash;

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

  it('ignores the theming provenance (its source is a gitignored build artifact)', () => {
    const manifest = {
      sources: [],
      theming: { artifact: 'pack/theming-tokens.md', source: 'packages/mcp/data/documentation.json' },
    };
    // readSource returns null (the build artifact is absent on a fresh checkout);
    // theming lives outside sources[], so drift must not flag it.
    expect(computeDrift(manifest, () => null)).toEqual([]);
  });
});

describe('computeCoverage', () => {
  const recorded = (artifact, source) => ({ artifact, source, contentHash: sha256(source) });
  const A = { artifact: 'pack/recipes/a.md', source: 'stories/a/basic.story.ts', body: 'body-a' };
  const B = { artifact: 'pack/recipes/b.md', source: 'stories/b/basic.story.ts', body: 'body-b' };
  const disk = { [A.artifact]: A.body, [B.artifact]: B.body };
  const readDisk = (artifact) => disk[artifact] ?? null;

  it('reports nothing when the recorded recipes match the stories', () => {
    const manifest = { sources: [recorded(A.artifact, A.source), recorded(B.artifact, B.source)] };
    expect(computeCoverage(manifest, [A, B], readDisk)).toEqual([]);
  });

  it('flags a selected recipe the manifest does not record', () => {
    const manifest = { sources: [recorded(A.artifact, A.source)] };
    expect(computeCoverage(manifest, [A, B], readDisk)).toEqual([
      { artifact: B.artifact, source: B.source, reason: 'recipe not recorded' },
    ]);
  });

  it('flags a folder whose representative story changed', () => {
    const manifest = { sources: [recorded(A.artifact, 'stories/a/other.story.ts')] };
    expect(computeCoverage(manifest, [A], readDisk)).toEqual([
      { artifact: A.artifact, source: A.source, reason: 'source changed' },
    ]);
  });

  it('flags a recorded recipe that is no longer selected', () => {
    const manifest = { sources: [recorded(A.artifact, A.source), recorded(B.artifact, B.source)] };
    expect(computeCoverage(manifest, [A], readDisk)).toEqual([
      { artifact: B.artifact, source: B.source, reason: 'recipe no longer selected' },
    ]);
  });

  it('flags a recorded and expected recipe whose file is missing', () => {
    const manifest = { sources: [recorded(A.artifact, A.source)] };
    expect(computeCoverage(manifest, [A], () => null)).toEqual([
      { artifact: A.artifact, source: A.source, reason: 'recipe file missing' },
    ]);
  });

  it('flags a committed recipe whose body differs from the re-rendered one', () => {
    const manifest = { sources: [recorded(A.artifact, A.source)] };
    expect(computeCoverage(manifest, [A], () => 'hand-edited')).toEqual([
      { artifact: A.artifact, source: A.source, reason: 'recipe body stale' },
    ]);
  });

  it('ignores the theming artifact', () => {
    const manifest = {
      sources: [recorded(A.artifact, A.source), recorded('pack/theming-tokens.md', 'docs.json')],
      theming: { artifact: 'pack/theming-tokens.md', source: 'docs.json' },
    };
    expect(computeCoverage(manifest, [A], readDisk)).toEqual([]);
  });
});
