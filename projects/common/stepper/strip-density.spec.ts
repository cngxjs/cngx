import type { DestroyRef } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createStripDensity } from './strip-density';

// Controllable ResizeObserver: captures the callback so the spec can
// push container widths and assert the density rung. The chart
// ResizeObserverMock is a no-op stub (cannot emit), so a local one is
// needed here to drive threshold crossings.
let lastCallback: ResizeObserverCallback | null = null;
class ControllableResizeObserver {
  constructor(cb: ResizeObserverCallback) {
    lastCallback = cb;
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
function emitWidth(width: number): void {
  lastCallback?.([{ contentRect: { width } } as ResizeObserverEntry], {} as ResizeObserver);
}

const noopDestroyRef = { onDestroy: () => undefined } as unknown as DestroyRef;

function make(opts: {
  stepCount?: number;
  density?: 'comfortable' | 'auto';
  compact?: number;
  minimal?: number;
}) {
  return createStripDensity({
    element: document.createElement('div'),
    stepCount: () => opts.stepCount ?? 5,
    density: () => opts.density ?? 'auto',
    breakpoints: () => ({ compact: opts.compact ?? 120, minimal: opts.minimal ?? 64 }),
    destroyRef: noopDestroyRef,
  });
}

describe('createStripDensity', () => {
  beforeEach(() => {
    lastCallback = null;
    vi.stubGlobal('ResizeObserver', ControllableResizeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 'full' under 'comfortable' regardless of width", () => {
    const density = make({ density: 'comfortable', stepCount: 20 });
    emitWidth(100); // 5px/step - would be 'minimal' under 'auto'
    expect(density()).toBe('full');
  });

  it("returns 'full' before the first measurement (width 0)", () => {
    const density = make({ density: 'auto' });
    expect(density()).toBe('full');
  });

  it('crosses full -> compact -> minimal at the configured per-step thresholds', () => {
    const density = make({ density: 'auto', stepCount: 5, compact: 120, minimal: 64 });
    emitWidth(5 * 120); // 120 px/step -> full
    expect(density()).toBe('full');
    emitWidth(5 * 100); // 100 px/step -> compact (>= 64, < 120)
    expect(density()).toBe('compact');
    emitWidth(5 * 50); // 50 px/step -> minimal (< 64)
    expect(density()).toBe('minimal');
  });

  it("returns 'full' for an empty strip", () => {
    const density = make({ density: 'auto', stepCount: 0 });
    emitWidth(800);
    expect(density()).toBe('full');
  });
});
