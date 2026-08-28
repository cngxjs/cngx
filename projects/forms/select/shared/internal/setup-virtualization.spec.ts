import { Injector, computed, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CNGX_PANEL_RENDERER_FACTORY, type PanelRenderer } from '../panel-renderer';
import type { CngxSelectOptionDef } from '../option.model';
import { setupVirtualization } from './setup-virtualization';
import type { CngxSelectCore } from './select-core';

function makeOptions(count: number): readonly CngxSelectOptionDef<number>[] {
  return Array.from({ length: count }, (_, i) => ({ value: i, label: `Item ${i}` }));
}

function run(renderer: PanelRenderer<number>): {
  virtualItemCount: () => number | undefined;
  virtualWindowStart: () => number;
} {
  TestBed.configureTestingModule({
    providers: [{ provide: CNGX_PANEL_RENDERER_FACTORY, useValue: () => renderer }],
  });
  const flatOptions = signal(makeOptions(50));
  const core = { flatOptions } as unknown as CngxSelectCore<number, number>;
  return runInInjectionContext(TestBed.inject(Injector), () =>
    setupVirtualization<number, number>({
      core,
      popoverRef: signal(undefined),
      listboxRef: signal(undefined),
      virtualization: null,
    }),
  );
}

describe('setupVirtualization - virtualWindowStart', () => {
  it('reports the renderer window start while a true subset is rendered', () => {
    const all = signal(makeOptions(50));
    const start = signal(20);
    const renderer: PanelRenderer<number> = {
      renderOptions: computed(() => all().slice(start(), start() + 10)),
      totalCount: computed(() => all().length),
      virtualizer: {
        startIndex: start,
        offsetBefore: signal(0),
        offsetAfter: signal(0),
        setsize: computed(() => all().length),
        scrollToIndex: () => undefined,
      },
    };
    const setup = run(renderer);
    expect(setup.virtualItemCount()).toBe(50);
    expect(setup.virtualWindowStart()).toBe(20);

    start.set(35);
    expect(setup.virtualWindowStart()).toBe(35);
  });

  it('reports 0 while the full list renders even when the recycler start has drifted', () => {
    // Threshold-identity mode: full list in the DOM, virtualizer stays
    // attached and its startIndex may hold a stale scroll position.
    const all = signal(makeOptions(50));
    const driftedStart = signal(20);
    const renderer: PanelRenderer<number> = {
      renderOptions: computed(() => all()),
      totalCount: computed(() => all().length),
      virtualizer: {
        startIndex: driftedStart,
        offsetBefore: signal(0),
        offsetAfter: signal(0),
        setsize: computed(() => all().length),
        scrollToIndex: () => undefined,
      },
    };
    const setup = run(renderer);
    expect(setup.virtualWindowStart()).toBe(0);
  });

  it('reports 0 and no virtualItemCount for a renderer without virtualizer', () => {
    const all = signal(makeOptions(50));
    const renderer: PanelRenderer<number> = {
      renderOptions: computed(() => all()),
      totalCount: computed(() => all().length),
    };
    const setup = run(renderer);
    expect(setup.virtualItemCount()).toBeUndefined();
    expect(setup.virtualWindowStart()).toBe(0);
  });
});
