import { Component, DestroyRef, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { createMatchMediaMock, type MatchMediaMock } from '@cngx/testing';

import { type CngxChartContext } from '../chart/chart-context';
import { type LayerGeometry } from '../layers/chart-layer';
import {
  type ChartRendererDeps,
  type CngxChartRenderer,
  type CngxChartRendererFactory,
} from './chart-renderer';
import {
  createChartRendererController,
  type CngxChartRendererController,
} from './chart-renderer-controller';

interface RendererSpy {
  mode: 'svg' | 'canvas';
  mount: ReturnType<typeof vi.fn>;
  paint: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  invalidateColorCache: ReturnType<typeof vi.fn>;
}

const GEOM: LayerGeometry = { kind: 'bar', rects: [{ x: 0, y: 0, w: 1, h: 1, color: null }] };

@Component({ standalone: true, template: '' })
class ControllerHost {
  readonly mode = signal<'svg' | 'canvas'>('svg');
  readonly geometries = signal<readonly LayerGeometry[]>([]);
  readonly dims = signal({ width: 100, height: 50 });
  readonly factoryCalls: Array<'svg' | 'canvas'> = [];
  readonly renderers: RendererSpy[] = [];
  readonly depsSeen: ChartRendererDeps[] = [];

  readonly factory: CngxChartRendererFactory = (mode, deps) => {
    this.factoryCalls.push(mode);
    this.depsSeen.push(deps);
    const spy: RendererSpy = {
      mode,
      mount: vi.fn(),
      paint: vi.fn(),
      destroy: vi.fn(),
      invalidateColorCache: vi.fn(),
    };
    this.renderers.push(spy);
    return spy as unknown as CngxChartRenderer;
  };

  readonly controller: CngxChartRendererController;

  constructor() {
    const host = document.createElement('div');
    const ctx = { dimensions: this.dims } as unknown as CngxChartContext;
    this.controller = createChartRendererController({
      host,
      ctx,
      mode: this.mode,
      geometries: this.geometries,
      factory: this.factory,
      destroyRef: inject(DestroyRef),
    });
  }

  get last(): RendererSpy {
    return this.renderers[this.renderers.length - 1];
  }
}

describe('createChartRendererController', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<ControllerHost>>;
  let host: ControllerHost;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ControllerHost] });
    fixture = TestBed.createComponent(ControllerHost);
    TestBed.tick();
    host = fixture.componentInstance;
  });

  it('builds the svg backend once and mounts it on init (fake factory honoured)', () => {
    expect(host.factoryCalls).toEqual(['svg']);
    expect(host.renderers[0].mode).toBe('svg');
    expect(host.renderers[0].mount).toHaveBeenCalledOnce();
  });

  it('destroys the previous backend and mounts the new one on mode flip', () => {
    host.mode.set('canvas');
    TestBed.tick();
    expect(host.factoryCalls).toEqual(['svg', 'canvas']);
    expect(host.renderers[0].destroy).toHaveBeenCalled();
    expect(host.renderers[1].mode).toBe('canvas');
    expect(host.renderers[1].mount).toHaveBeenCalledOnce();
  });

  it('paints once per geometry emission', () => {
    const before = host.last.paint.mock.calls.length;
    host.geometries.set([GEOM]);
    TestBed.tick();
    expect(host.last.paint.mock.calls.length).toBe(before + 1);
  });

  it('invalidates the color cache before painting on a dimensions change', () => {
    host.dims.set({ width: 200, height: 120 });
    TestBed.tick();
    const r = host.last;
    expect(r.invalidateColorCache).toHaveBeenCalled();
    const invOrder = r.invalidateColorCache.mock.invocationCallOrder.at(-1) ?? 0;
    const paintOrder = r.paint.mock.invocationCallOrder.at(-1) ?? 0;
    expect(invOrder).toBeLessThan(paintOrder);
  });

  it('does not invalidate when a fresh dimensions object carries the same values', () => {
    const before = host.last.invalidateColorCache.mock.calls.length;
    host.dims.set({ width: 100, height: 50 }); // same numeric values, fresh object
    TestBed.tick();
    expect(host.last.invalidateColorCache.mock.calls.length).toBe(before);
  });

  it('destroys the current backend when the injection context is torn down', () => {
    const r = host.last;
    fixture.destroy();
    expect(r.destroy).toHaveBeenCalled();
  });
});

describe('createChartRendererController palette media queries', () => {
  const FORCED = '(forced-colors: active)';
  const DARK = '(prefers-color-scheme: dark)';
  let mm: MatchMediaMock;
  let fixture: ReturnType<typeof TestBed.createComponent<ControllerHost>>;
  let host: ControllerHost;

  beforeEach(() => {
    mm = createMatchMediaMock(false);
    mm.install(window);
    mm.trigger(true, FORCED);
    TestBed.configureTestingModule({ imports: [ControllerHost] });
    fixture = TestBed.createComponent(ControllerHost);
    TestBed.tick();
    host = fixture.componentInstance;
  });

  it('hands the backend a forcedColors signal seeded from the media query', () => {
    expect(host.depsSeen[0].forcedColors?.()).toBe(true);
  });

  it.each([
    ['forced-colors', FORCED, false],
    ['colour-scheme', DARK, true],
  ])('invalidates once and paints once on a %s flip', (_label, query, matches) => {
    const r = host.last;
    const invBefore = r.invalidateColorCache.mock.calls.length;
    const paintBefore = r.paint.mock.calls.length;

    mm.trigger(matches, query);
    TestBed.tick();

    expect(r.invalidateColorCache.mock.calls.length).toBe(invBefore + 1);
    expect(r.paint.mock.calls.length).toBe(paintBefore + 1);
    const invOrder = r.invalidateColorCache.mock.invocationCallOrder.at(-1) ?? 0;
    const paintOrder = r.paint.mock.invocationCallOrder.at(-1) ?? 0;
    expect(invOrder).toBeLessThan(paintOrder);
  });

  it('reflects a forced-colors flip in the signal the backend holds', () => {
    mm.trigger(false, FORCED);
    TestBed.tick();
    expect(host.depsSeen[0].forcedColors?.()).toBe(false);
  });

  it('removes both media-query listeners on destroy', () => {
    const lists = (window.matchMedia as unknown as Mock).mock.results.map(
      (res) => res.value as MediaQueryList,
    );
    const palette = lists.filter((l) => l.media === FORCED || l.media === DARK);
    expect(palette).toHaveLength(2);

    fixture.destroy();

    for (const l of palette) {
      expect(l.removeEventListener).toHaveBeenCalledOnce();
    }
  });
});
