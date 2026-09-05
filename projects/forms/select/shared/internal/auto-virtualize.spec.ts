import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CngxPopover } from '@cngx/common/popover';

import type { CngxSelectOptionDef } from '../option.model';
import type { PanelRenderer } from '../panel-renderer';
import { createAutoPanelRenderer } from './auto-virtualize';

class MockResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

const TOTAL = 1000;

describe('createAutoPanelRenderer - estimateSize clamp', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    container = document.createElement('div');
    Object.defineProperty(container, 'scrollTop', {
      value: 0,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(container, 'clientHeight', {
      value: 500,
      writable: true,
      configurable: true,
    });
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    vi.unstubAllGlobals();
  });

  function makeRenderer(estimateSize: number): PanelRenderer<number> {
    const flatOptions = signal<readonly CngxSelectOptionDef<number>[]>(
      Array.from({ length: TOTAL }, (_, i) => ({ value: i, label: `Item ${i}` })),
    );
    const popover = { elementRef: { nativeElement: container } } as unknown as CngxPopover;
    let renderer!: PanelRenderer<number>;
    TestBed.runInInjectionContext(() => {
      renderer = createAutoPanelRenderer<number>({
        flatOptions,
        popoverRef: signal<CngxPopover | undefined>(popover),
        virtualization: { estimateSize },
      });
    });
    TestBed.flushEffects();
    return renderer;
  }

  it('clamps estimateSize 0 to 1px so the window stays a finite subset', () => {
    const renderer = makeRenderer(0);
    const rendered = renderer.renderOptions();
    expect(Number.isFinite(rendered.length)).toBe(true);
    expect(rendered.length).toBeGreaterThan(0);
    expect(rendered.length).toBeLessThan(TOTAL);
    expect(Number.isFinite(renderer.virtualizer!.offsetAfter())).toBe(true);
    expect(renderer.virtualizer!.offsetAfter()).toBeGreaterThan(0);
  });

  it('clamps negative estimates the same way', () => {
    const renderer = makeRenderer(-10);
    const rendered = renderer.renderOptions();
    expect(rendered.length).toBeGreaterThan(0);
    expect(rendered.length).toBeLessThan(TOTAL);
    expect(renderer.virtualizer!.offsetAfter()).toBeGreaterThan(0);
  });

  it('keeps the 32px default when estimateSize is unset', () => {
    const flatOptions = signal<readonly CngxSelectOptionDef<number>[]>(
      Array.from({ length: TOTAL }, (_, i) => ({ value: i, label: `Item ${i}` })),
    );
    const popover = { elementRef: { nativeElement: container } } as unknown as CngxPopover;
    let renderer!: PanelRenderer<number>;
    TestBed.runInInjectionContext(() => {
      renderer = createAutoPanelRenderer<number>({
        flatOptions,
        popoverRef: signal<CngxPopover | undefined>(popover),
        virtualization: {},
      });
    });
    TestBed.flushEffects();
    // 500px viewport / 32px estimate + overscan - a small window.
    expect(renderer.renderOptions().length).toBeLessThan(100);
  });
});
