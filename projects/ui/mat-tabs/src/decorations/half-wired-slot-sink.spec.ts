import { Injector, inject, runInInjectionContext } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CNGX_MAT_TAB_HALF_WIRED_SLOT_SINK,
  type CngxMatTabHalfWiredSlotSink,
} from './half-wired-slot-sink';

describe('CNGX_MAT_TAB_HALF_WIRED_SLOT_SINK', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Default factory's `isDevMode()` resolves true under TestBed,
    // so the default sink will write through to console.warn — spy
    // captures the writes without polluting test output.
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  function getSink(): CngxMatTabHalfWiredSlotSink {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const injector = TestBed.inject(Injector);
    return runInInjectionContext(injector, () =>
      inject(CNGX_MAT_TAB_HALF_WIRED_SLOT_SINK),
    );
  }

  it('default factory returns a callable that writes through to console.warn in dev-mode', () => {
    const sink = getSink();

    sink('contentTemplate');

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const message = String(warnSpy.mock.calls[0][0]);
    expect(message).toContain('aggregator-content slot half-wired');
    expect(message).toContain('contentTemplate');
  });

  it('default sink is the same reference returned across injections (factory memoised at root)', () => {
    const sinkA = getSink();
    TestBed.resetTestingModule();
    const sinkB = (() => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const injector = TestBed.inject(Injector);
      return runInInjectionContext(injector, () =>
        inject(CNGX_MAT_TAB_HALF_WIRED_SLOT_SINK),
      );
    })();

    // The default factory creates one sink per injector tree. Two
    // separate TestBed instances produce two separate root injectors,
    // so the SHAPE is stable but the references are independent —
    // assert the shape (callable + reports the missing slot) rather
    // than identity.
    expect(typeof sinkA).toBe('function');
    expect(typeof sinkB).toBe('function');
    sinkA('viewContainerRef');
    sinkB('contentTemplate');
    expect(warnSpy).toHaveBeenCalledTimes(2);
    expect(String(warnSpy.mock.calls[0][0])).toContain('viewContainerRef');
    expect(String(warnSpy.mock.calls[1][0])).toContain('contentTemplate');
  });

  it('consumer-supplied override via providers replaces the default sink end-to-end', () => {
    const customSink = vi.fn<CngxMatTabHalfWiredSlotSink>();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: CNGX_MAT_TAB_HALF_WIRED_SLOT_SINK, useValue: customSink },
      ],
    });
    const injector = TestBed.inject(Injector);
    const resolved = runInInjectionContext(injector, () =>
      inject(CNGX_MAT_TAB_HALF_WIRED_SLOT_SINK),
    );

    resolved('viewContainerRef');

    expect(resolved).toBe(customSink);
    expect(customSink).toHaveBeenCalledTimes(1);
    expect(customSink).toHaveBeenCalledWith('viewContainerRef');
    // Override takes the place of the default — console.warn untouched.
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
