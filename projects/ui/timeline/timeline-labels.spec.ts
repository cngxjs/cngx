import { signal } from '@angular/core';
import type { CngxTimelineLabels, TimelineGroup } from '@cngx/common/timeline';
import { describe, expect, it } from 'vitest';

import { createTimelineFallbackCopy } from './timeline-labels';

const group: TimelineGroup<unknown> = { key: 'k', start: new Date(2026, 0, 1), items: [] };

describe('createTimelineFallbackCopy', () => {
  it('keeps the bundle reference when a recompute yields equal copy', () => {
    const labels = signal<CngxTimelineLabels>({ retry: 'Retry' });
    const copy = createTimelineFallbackCopy({ labels });
    const first = copy();

    labels.set({ retry: 'Retry' });
    expect(copy()).toBe(first);
  });

  it('keeps groupLabel reference-stable across an unrelated label change', () => {
    const format = (g: TimelineGroup<unknown>): string => `Week ${g.key}`;
    const labels = signal<CngxTimelineLabels>({ retry: 'Retry', groupLabel: format });
    const copy = createTimelineFallbackCopy({ labels });
    const before = copy();

    labels.set({ retry: 'Erneut versuchen', groupLabel: format });
    const after = copy();
    expect(after).not.toBe(before);
    expect(after.retry).toBe('Erneut versuchen');
    expect(after.groupLabel).toBe(before.groupLabel);
  });

  it('rebuilds groupLabel when the formatter changes, and falls back to the band key', () => {
    const labels = signal<CngxTimelineLabels>({});
    const copy = createTimelineFallbackCopy({ labels });
    const bare = copy().groupLabel;
    expect(bare(group, 'en-US')).toBe('k');

    labels.set({ groupLabel: (g, locale) => `Band ${g.key} (${locale})` });
    expect(copy().groupLabel).not.toBe(bare);
    expect(copy().groupLabel(group, 'de-DE')).toBe('Band k (de-DE)');
  });
});
