import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { createRecyclerPanelRendererFactory } from './recycler-panel-renderer';
import type { CngxSelectOptionDef } from './option.model';
import type { CngxRecycler } from '@cngx/common/data';

// Minimal mock surface — the factory only touches five recycler signals.
function makeMockRecycler(overrides?: {
  start?: number;
  end?: number;
  offsetBefore?: number;
  offsetAfter?: number;
  ariaSetSize?: number;
}) {
  return {
    start: signal(overrides?.start ?? 0),
    end: signal(overrides?.end ?? 20),
    offsetBefore: signal(overrides?.offsetBefore ?? 0),
    offsetAfter: signal(overrides?.offsetAfter ?? 0),
    ariaSetSize: signal(overrides?.ariaSetSize ?? 0),
  } as unknown as CngxRecycler;
}

function makeOptions(n: number): CngxSelectOptionDef<string>[] {
  return Array.from({ length: n }, (_, i) => ({
    value: `v${i}`,
    label: `label ${i}`,
  }));
}

describe('createRecyclerPanelRendererFactory', () => {
  it('slices flatOptions between recycler.start and recycler.end', () => {
    const recycler = makeMockRecycler({ start: 100, end: 120 });
    const factory = createRecyclerPanelRendererFactory(recycler);
    const options = makeOptions(500);
    const renderer = factory({ flatOptions: signal(options) });

    const out = renderer.renderOptions();
    expect(out).toHaveLength(20);
    expect(out[0]).toBe(options[100]);
    expect(out[19]).toBe(options[119]);
  });

  it('returns the source array verbatim when window covers all options (identity shortcut)', () => {
    const recycler = makeMockRecycler({ start: 0, end: 100 });
    const factory = createRecyclerPanelRendererFactory(recycler);
    const options = makeOptions(20);
    const flatOptions = signal(options);
    const renderer = factory({ flatOptions });

    // Reference equality — no slice allocation on the fast path.
    expect(renderer.renderOptions()).toBe(flatOptions());
  });

  it('clamps the window end to the option count to avoid out-of-range slice', () => {
    const recycler = makeMockRecycler({ start: 95, end: 120 });
    const factory = createRecyclerPanelRendererFactory(recycler);
    const options = makeOptions(100);
    const renderer = factory({ flatOptions: signal(options) });

    const out = renderer.renderOptions();
    expect(out).toHaveLength(5);
    expect(out[0]).toBe(options[95]);
    expect(out[4]).toBe(options[99]);
  });

  it('exposes totalCount as flatOptions().length', () => {
    const recycler = makeMockRecycler();
    const factory = createRecyclerPanelRendererFactory(recycler);
    const flatOptions = signal(makeOptions(5000));
    const renderer = factory({ flatOptions });

    expect(renderer.totalCount?.()).toBe(5000);

    flatOptions.set(makeOptions(3000));
    expect(renderer.totalCount?.()).toBe(3000);
  });

  it('forwards recycler.start, offsetBefore, offsetAfter, ariaSetSize via virtualizer bundle', () => {
    const recycler = makeMockRecycler({
      start: 42,
      offsetBefore: 1512,
      offsetAfter: 17580,
      ariaSetSize: 10000,
    });
    const factory = createRecyclerPanelRendererFactory(recycler);
    const renderer = factory({ flatOptions: signal(makeOptions(10000)) });

    expect(renderer.virtualizer).toBeDefined();
    expect(renderer.virtualizer!.startIndex()).toBe(42);
    expect(renderer.virtualizer!.offsetBefore()).toBe(1512);
    expect(renderer.virtualizer!.offsetAfter()).toBe(17580);
    expect(renderer.virtualizer!.setsize()).toBe(10000);
  });
});
