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
} from './mat-tabs-config';
import {
  CNGX_MAT_TAB_HALF_WIRED_SLOT_SINK,
  type CngxMatTabHalfWiredSlotSink,
} from './decorations/half-wired-slot-sink';

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

  it('falls back to CNGX_MAT_TAB_HALF_WIRED_SLOT_SINK token when config does not specify halfWiredSlotSink', () => {
    const tokenSink = vi.fn<CngxMatTabHalfWiredSlotSink>();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        // Anchor knob set via config; sink left unset so the standalone
        // token path resolves it. Telemetry-only consumers pick up the
        // sink without taking a config-tier dependency.
        provideMatTabsConfig(withAnchorRetryAttempts(8)),
        { provide: CNGX_MAT_TAB_HALF_WIRED_SLOT_SINK, useValue: tokenSink },
      ],
    });
    const config = inject1(() => injectMatTabsConfig());
    expect(config.anchorMaxAttempts).toBe(8);
    expect(config.halfWiredSlotSink).toBe(tokenSink);
  });

  it('config-tier sink wins over standalone token', () => {
    const tokenSink = vi.fn<CngxMatTabHalfWiredSlotSink>();
    const configSink = vi.fn<CngxMatTabHalfWiredSlotSink>();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: CNGX_MAT_TAB_HALF_WIRED_SLOT_SINK, useValue: tokenSink },
        provideMatTabsConfig(withHalfWiredSlotSink(configSink)),
      ],
    });
    const config = inject1(() => injectMatTabsConfig());
    expect(config.halfWiredSlotSink).toBe(configSink);
    expect(config.halfWiredSlotSink).not.toBe(tokenSink);
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
});
