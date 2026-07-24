import { signal, type DestroyRef } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { type CngxChartContext } from '../chart/chart-context';
import { type ChartRendererDeps } from './chart-renderer';
import { createSvgRenderer } from './svg-renderer';

function fakeDeps(): ChartRendererDeps {
  const ctx = {
    dimensions: signal({ width: 100, height: 50 }),
    renderSvg: signal(true),
  } as unknown as CngxChartContext;
  const destroyRef = { onDestroy: vi.fn() } as unknown as DestroyRef;
  return { ctx, destroyRef };
}

describe('createSvgRenderer', () => {
  it('is a passthrough: mode svg, every method a no-op that touches no DOM', () => {
    const deps = fakeDeps();
    const renderer = createSvgRenderer(deps);
    const host = document.createElement('div');

    expect(renderer.mode).toBe('svg');
    expect(() => {
      renderer.mount(host, deps.ctx);
      renderer.paint([]);
      renderer.invalidateColorCache?.();
      renderer.destroy();
    }).not.toThrow();

    expect(host.querySelector('canvas')).toBeNull();
    // Passthrough never touches the renderSvg gate.
    expect(typeof deps.ctx.renderSvg).toBe('function');
    expect(deps.ctx.renderSvg()).toBe(true);
  });
});
