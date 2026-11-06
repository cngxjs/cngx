import { Injector, computed, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { CngxPopover } from '@cngx/common/popover';

import { CNGX_SELECT_DEFAULTS, type CngxSelectVirtualizationConfig } from '../config';
import { CNGX_PANEL_RENDERER_FACTORY, type PanelRenderer } from '../panel-renderer';
import type { CngxSelectOptionDef, CngxSelectOptionsInput } from '../option.model';
import { setupVirtualization } from './setup-virtualization';
import type { CngxSelectCore } from './select-core';

function makeOptions(count: number): readonly CngxSelectOptionDef<number>[] {
  return Array.from({ length: count }, (_, i) => ({ value: i, label: `Item ${i}` }));
}

function run(
  renderer: PanelRenderer<number>,
  effective: CngxSelectOptionsInput<number> = makeOptions(50),
): {
  virtualItemCount: () => number | undefined;
  virtualWindowStart: () => number;
} {
  TestBed.configureTestingModule({
    providers: [{ provide: CNGX_PANEL_RENDERER_FACTORY, useValue: () => renderer }],
  });
  const flatOptions = signal(makeOptions(50));
  const core = {
    flatOptions,
    effectiveOptions: signal(effective),
  } as unknown as CngxSelectCore<number, number>;
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
        rowSizeHint: signal(32),
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
        rowSizeHint: signal(32),
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

describe('setupVirtualization - grouped lists', () => {
  it('reports a grouped list as non-virtual while the renderer holds a window', () => {
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
        rowSizeHint: signal(32),
        scrollToIndex: () => undefined,
      },
    };
    const setup = run(renderer, [{ label: 'Group', children: makeOptions(50) }]);
    expect(setup.virtualItemCount()).toBeUndefined();
    expect(setup.virtualWindowStart()).toBe(0);
  });
});

describe('setupVirtualization - CNGX2028', () => {
  afterEach(() => vi.restoreAllMocks());

  function warnings(
    virtualization: CngxSelectVirtualizationConfig | null,
    effective: CngxSelectOptionsInput<number>,
    renderer?: PanelRenderer<number>,
  ): { coded: () => unknown[]; open: () => void; close: () => void } {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    if (renderer) {
      TestBed.configureTestingModule({
        providers: [{ provide: CNGX_PANEL_RENDERER_FACTORY, useValue: () => renderer }],
      });
    }
    const visible = signal(false);
    const core = {
      flatOptions: signal(makeOptions(50)),
      effectiveOptions: signal(effective),
    } as unknown as CngxSelectCore<number, number>;
    runInInjectionContext(TestBed.inject(Injector), () =>
      setupVirtualization<number, number>({
        core,
        popoverRef: signal({ isVisible: visible } as unknown as CngxPopover),
        listboxRef: signal(undefined),
        virtualization,
      }),
    );
    TestBed.flushEffects();
    const setOpen = (open: boolean): void => {
      visible.set(open);
      TestBed.flushEffects();
    };
    return {
      coded: () => warn.mock.calls.filter((c) => /^CNGX2028: /.test(String(c[0]))),
      open: () => setOpen(true),
      close: () => setOpen(false),
    };
  }

  const GROUPED: CngxSelectOptionsInput<number> = [{ label: 'Group', children: makeOptions(50) }];

  it('stays silent for grouped options under the default config', () => {
    const { coded, open } = warnings(CNGX_SELECT_DEFAULTS.virtualization, GROUPED);
    open();
    expect(coded().length).toBe(0);
  });

  it('warns once, on the first open, for grouped options under an explicit config', () => {
    const { coded, open, close } = warnings({ threshold: 200 }, GROUPED);
    expect(coded().length).toBe(0);
    open();
    expect(coded().length).toBe(1);
    close();
    open();
    expect(coded().length).toBe(1);
  });

  it('stays silent for a flat list under an explicit config', () => {
    const { coded, open } = warnings({ threshold: 200 }, makeOptions(50));
    open();
    expect(coded().length).toBe(0);
  });

  it('stays silent with virtualization off', () => {
    const { coded, open } = warnings(null, GROUPED);
    open();
    expect(coded().length).toBe(0);
  });

  it('warns for a virtualizing consumer renderer, not for an identity-shaped one', () => {
    const virtualizing: PanelRenderer<number> = {
      renderOptions: signal(makeOptions(10)),
      virtualizer: {
        startIndex: signal(0),
        offsetBefore: signal(0),
        offsetAfter: signal(0),
        setsize: signal(50),
        rowSizeHint: signal(32),
        scrollToIndex: () => undefined,
      },
    };
    const { coded, open } = warnings(null, GROUPED, virtualizing);
    open();
    expect(coded().length).toBe(1);
  });

  it('stays silent for an identity-shaped consumer renderer under an explicit config', () => {
    const identity: PanelRenderer<number> = { renderOptions: signal(makeOptions(50)) };
    const { coded, open } = warnings({ threshold: 200 }, GROUPED, identity);
    open();
    expect(coded().length).toBe(0);
  });
});

describe('setupVirtualization module surface', () => {
  it('no longer re-exports CngxSelectCompareFn', () => {
    // @ts-expect-error - removed, import it from select-core
    const compare: import('./setup-virtualization').CngxSelectCompareFn<number> | undefined =
      undefined;
    expect(compare).toBeUndefined();
  });
});
