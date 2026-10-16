import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createResizeObserverMock } from '@cngx/testing';

import type { CngxPopover, CngxPopoverPresentation } from '@cngx/common/popover';

import type { CngxSelectOptionDef } from '../option.model';
import type { PanelRenderer } from '../panel-renderer';
import { createAutoPanelRenderer } from './auto-virtualize';

const TOTAL = 1000;

describe('createAutoPanelRenderer - estimateSize clamp', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    createResizeObserverMock().install(window);
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

describe('createAutoPanelRenderer - scroll element follows the sheet presentation', () => {
  beforeEach(() => {
    createResizeObserverMock().install(window);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('scrolls the popover while anchored and the listbox in a sheet', () => {
    const panel = document.createElement('div');
    const listbox = document.createElement('div');
    document.body.append(panel, listbox);
    const panelAdd = vi.spyOn(panel, 'addEventListener');
    const panelRemove = vi.spyOn(panel, 'removeEventListener');
    const listboxAdd = vi.spyOn(listbox, 'addEventListener');
    const presentation = signal<CngxPopoverPresentation>('anchored');
    const popover = { elementRef: { nativeElement: panel } } as unknown as CngxPopover;

    TestBed.runInInjectionContext(() => {
      createAutoPanelRenderer<number>({
        flatOptions: signal([{ value: 1, label: 'One' }]),
        popoverRef: signal<CngxPopover | undefined>(popover),
        virtualization: {},
        presentation,
        listboxElement: signal(listbox),
      });
    });
    TestBed.flushEffects();
    expect(panelAdd).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
    expect(listboxAdd).not.toHaveBeenCalledWith('scroll', expect.any(Function), expect.anything());

    presentation.set('sheet');
    TestBed.flushEffects();
    expect(panelRemove).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(listboxAdd).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });

    panel.remove();
    listbox.remove();
  });
});
