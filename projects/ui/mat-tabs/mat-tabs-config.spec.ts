import {
  Injector,
  inject,
  provideZonelessChangeDetection,
  runInInjectionContext,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CNGX_MAT_TABS_CONFIG,
  injectMatTabsConfig,
  provideMatTabsConfig,
  provideMatTabsConfigAt,
  withAnchorRetryAttempts,
  withHalfWiredSlotSink,
  withMatTabRejectionTemplate,
} from './mat-tabs-config';
import type { CngxMatTabRejectionContentContext } from './decorations/mat-tab-rejection-content.directive';
import type { CngxMatTabHalfWiredSlotSink } from './decorations/half-wired-slot-sink';

describe('provideMatTabsConfig + injectMatTabsConfig', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  function inject1<T>(fn: () => T): T {
    const injector = TestBed.inject(Injector);
    return runInInjectionContext(injector, fn);
  }

  it('returns library defaults when no provider is set', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const config = inject1(() => injectMatTabsConfig());
    expect(config.anchorMaxAttempts).toBe(5);
    expect(typeof config.halfWiredSlotSink).toBe('function');
    expect(config.templates).toEqual({});
  });

  it('carries templates.rejection via withMatTabRejectionTemplate and merges nested', () => {
    const tpl = {} as import('@angular/core').TemplateRef<CngxMatTabRejectionContentContext>;
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideMatTabsConfig(withAnchorRetryAttempts(9), withMatTabRejectionTemplate(tpl)),
      ],
    });
    const config = inject1(() => injectMatTabsConfig());
    // The nested-merge keeps sibling keys and the flat keys intact.
    expect(config.templates.rejection).toBe(tpl);
    expect(config.anchorMaxAttempts).toBe(9);
  });

  it('overrides anchorMaxAttempts via withAnchorRetryAttempts', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideMatTabsConfig(withAnchorRetryAttempts(20)),
      ],
    });
    const config = inject1(() => injectMatTabsConfig());
    expect(config.anchorMaxAttempts).toBe(20);
  });

  it('overrides halfWiredSlotSink via withHalfWiredSlotSink', () => {
    const customSink = vi.fn<CngxMatTabHalfWiredSlotSink>();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideMatTabsConfig(withHalfWiredSlotSink(customSink)),
      ],
    });
    const config = inject1(() => injectMatTabsConfig());
    expect(config.halfWiredSlotSink).toBe(customSink);
  });

  it('merges multiple features so the last write per key wins', () => {
    const first = vi.fn<CngxMatTabHalfWiredSlotSink>();
    const second = vi.fn<CngxMatTabHalfWiredSlotSink>();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideMatTabsConfig(
          withAnchorRetryAttempts(7),
          withHalfWiredSlotSink(first),
          withAnchorRetryAttempts(11),
          withHalfWiredSlotSink(second),
        ),
      ],
    });
    const config = inject1(() => injectMatTabsConfig());
    expect(config.anchorMaxAttempts).toBe(11);
    expect(config.halfWiredSlotSink).toBe(second);
  });

  it('provideMatTabsConfigAt exposes the same merge through component-scope viewProviders', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ...provideMatTabsConfigAt(withAnchorRetryAttempts(15)),
      ],
    });
    const stored = inject1(() => inject(CNGX_MAT_TABS_CONFIG));
    expect(stored.anchorMaxAttempts).toBe(15);
    const config = inject1(() => injectMatTabsConfig());
    expect(config.anchorMaxAttempts).toBe(15);
  });

  it('provideMatTabsConfigAt merges over the outer config instead of reverting root overrides', () => {
    const rootSink: CngxMatTabHalfWiredSlotSink = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideMatTabsConfig(withAnchorRetryAttempts(9), withHalfWiredSlotSink(rootSink)),
      ],
    });
    const child = Injector.create({
      providers: provideMatTabsConfigAt(withAnchorRetryAttempts(20)),
      parent: TestBed.inject(Injector),
    });

    const config = runInInjectionContext(child, () => injectMatTabsConfig());
    // Local feature wins for its own key...
    expect(config.anchorMaxAttempts).toBe(20);
    // ...but the root override for the untouched key survives - the
    // component-scope call must not revert it to the library default.
    expect(config.halfWiredSlotSink).toBe(rootSink);
  });
});
