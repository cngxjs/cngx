import { Component, signal, type Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createResizeObserverMock } from '@cngx/testing';

import type { CngxPopover, CngxPopoverPresentation } from '@cngx/common/popover';

import type { CngxSelectVirtualizationConfig } from '../config';
import type { CngxSelectOptionDef } from '../option.model';
import type { PanelRenderer } from '../panel-renderer';
import { createAutoPanelRenderer, type CngxSelectAutoRecyclerHandle } from './auto-virtualize';

const TOTAL = 1000;

// The virtualiser binds no state to the recycler, so a skeleton timing key
// would be inert; the config refuses one.
// @ts-expect-error -- skeletonDelay is not a virtualization key
const noSkeletonDelay: CngxSelectVirtualizationConfig = { skeletonDelay: 0 };
void noSkeletonDelay;

function items(count: number): readonly CngxSelectOptionDef<number>[] {
  return Array.from({ length: count }, (_, i) => ({ value: i, label: `Item ${i}` }));
}

function build(opts: {
  flatOptions: Signal<readonly CngxSelectOptionDef<number>[]>;
  popover: HTMLElement;
  virtualization: CngxSelectVirtualizationConfig;
  hasGroup?: Signal<boolean>;
  presentation?: Signal<CngxPopoverPresentation>;
  listbox?: HTMLElement;
  open?: Signal<boolean>;
}): { renderer: PanelRenderer<number>; handle: CngxSelectAutoRecyclerHandle } {
  const { renderer, autoRecycler } = createAutoPanelRenderer<number>({
    flatOptions: opts.flatOptions,
    hasGroup: opts.hasGroup ?? signal(false),
    popoverRef: signal<CngxPopover | undefined>({
      elementRef: { nativeElement: opts.popover },
      isVisible: opts.open ?? signal(true),
    } as unknown as CngxPopover),
    virtualization: opts.virtualization,
    presentation: opts.presentation,
    listboxElement: signal(opts.listbox),
  });
  return { renderer, handle: autoRecycler };
}

/** What `[cngxSelectAutoRecycler]` does on mount. */
function mountRecycler(handle: CngxSelectAutoRecyclerHandle): void {
  TestBed.runInInjectionContext(() => handle.slot.register(handle.create()));
  TestBed.flushEffects();
}

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

  function makeRenderer(virtualization: CngxSelectVirtualizationConfig): PanelRenderer<number> {
    const { renderer, handle } = build({
      flatOptions: signal(items(TOTAL)),
      popover: container,
      virtualization,
    });
    mountRecycler(handle);
    return renderer;
  }

  it('clamps estimateSize 0 to 1px so the window stays a finite subset', () => {
    const renderer = makeRenderer({ estimateSize: 0 });
    const rendered = renderer.renderOptions();
    expect(Number.isFinite(rendered.length)).toBe(true);
    expect(rendered.length).toBeGreaterThan(0);
    expect(rendered.length).toBeLessThan(TOTAL);
    expect(Number.isFinite(renderer.virtualizer!.offsetAfter())).toBe(true);
    expect(renderer.virtualizer!.offsetAfter()).toBeGreaterThan(0);
  });

  it('clamps negative estimates the same way', () => {
    const renderer = makeRenderer({ estimateSize: -10 });
    const rendered = renderer.renderOptions();
    expect(rendered.length).toBeGreaterThan(0);
    expect(rendered.length).toBeLessThan(TOTAL);
    expect(renderer.virtualizer!.offsetAfter()).toBeGreaterThan(0);
  });

  it('keeps the 32px fallback when estimateSize is unset and no row is measured', () => {
    const fallback = makeRenderer({}).renderOptions().length;
    expect(fallback).toBe(makeRenderer({ estimateSize: 32 }).renderOptions().length);
  });
});

describe('createAutoPanelRenderer - scroll element follows the sheet presentation', () => {
  beforeEach(() => {
    createResizeObserverMock().install(window);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('scrolls the popover while anchored and the panel shell in a sheet', () => {
    const panel = document.createElement('div');
    const shell = document.createElement('div');
    shell.className = 'cngx-select-panel-shell';
    const listbox = document.createElement('div');
    shell.append(listbox);
    document.body.append(panel, shell);
    const panelAdd = vi.spyOn(panel, 'addEventListener');
    const panelRemove = vi.spyOn(panel, 'removeEventListener');
    const shellAdd = vi.spyOn(shell, 'addEventListener');
    const listboxAdd = vi.spyOn(listbox, 'addEventListener');
    const presentation = signal<CngxPopoverPresentation>('anchored');

    const { handle } = build({
      flatOptions: signal([{ value: 1, label: 'One' }]),
      popover: panel,
      virtualization: {},
      presentation,
      listbox,
    });
    mountRecycler(handle);
    expect(panelAdd).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
    expect(shellAdd).not.toHaveBeenCalledWith('scroll', expect.any(Function), expect.anything());

    presentation.set('sheet');
    TestBed.flushEffects();
    expect(panelRemove).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(shellAdd).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
    expect(listboxAdd).not.toHaveBeenCalledWith('scroll', expect.any(Function), expect.anything());

    panel.remove();
    shell.remove();
  });
});

describe('createAutoPanelRenderer - recycler handle', () => {
  const THRESHOLD = { threshold: 200 };
  let popover: HTMLDivElement;

  beforeEach(() => {
    createResizeObserverMock().install(window);
    popover = document.createElement('div');
    Object.defineProperty(popover, 'clientHeight', { value: 500, configurable: true });
    document.body.appendChild(popover);
  });

  afterEach(() => {
    popover.remove();
    vi.unstubAllGlobals();
  });

  it('needs no injection context and asks for no recycler at 3 options', () => {
    const flatOptions = signal(items(3));
    const { renderer, handle } = build({ flatOptions, popover, virtualization: THRESHOLD });

    expect(handle.needed()).toBe(false);
    expect(handle.slot.current()).toBeNull();
    expect(renderer.renderOptions()).toBe(flatOptions());
    expect(renderer.totalCount?.()).toBe(3);
    expect(renderer.virtualizer?.startIndex()).toBe(0);
    expect(renderer.virtualizer?.offsetAfter()).toBe(0);
  });

  it('latches on crossing and never hands out the full list while the recycler is missing', () => {
    const flatOptions = signal(items(3));
    const { renderer, handle } = build({ flatOptions, popover, virtualization: THRESHOLD });

    flatOptions.set(items(TOTAL));
    expect(handle.needed()).toBe(true);
    expect(renderer.renderOptions()).toEqual([]);
    expect(renderer.totalCount?.()).toBe(TOTAL);

    mountRecycler(handle);
    const rendered = renderer.renderOptions().length;
    expect(rendered).toBeGreaterThan(0);
    expect(rendered).toBeLessThan(100);
  });

  it('never asks for a recycler for a grouped list', () => {
    const flatOptions = signal(items(TOTAL));
    const { renderer, handle } = build({
      flatOptions,
      popover,
      virtualization: THRESHOLD,
      hasGroup: signal(true),
    });

    expect(handle.needed()).toBe(false);
    expect(handle.slot.current()).toBeNull();
    expect(renderer.renderOptions()).toBe(flatOptions());
  });

  it('keeps the recycler and renders the full list after dropping below the threshold', () => {
    const flatOptions = signal(items(TOTAL));
    const { renderer, handle } = build({ flatOptions, popover, virtualization: THRESHOLD });
    expect(handle.needed()).toBe(true);
    mountRecycler(handle);
    const recycler = handle.slot.current();

    flatOptions.set(items(50));
    TestBed.flushEffects();

    expect(handle.needed()).toBe(true);
    expect(handle.slot.current()).toBe(recycler);
    expect(renderer.renderOptions().length).toBe(50);
  });

  it('latches from construction without a threshold, whatever the list size', () => {
    const { handle } = build({ flatOptions: signal(items(1)), popover, virtualization: {} });
    expect(handle.needed()).toBe(true);
  });
});

describe('createAutoPanelRenderer - row probe', () => {
  let container: HTMLDivElement;
  let ro: ReturnType<typeof createResizeObserverMock>;

  beforeEach(() => {
    ro = createResizeObserverMock();
    ro.install(window);
    container = document.createElement('div');
    Object.defineProperty(container, 'clientHeight', { value: 500, configurable: true });
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    vi.unstubAllGlobals();
  });

  @Component({ template: '' })
  class RenderTick {}

  /** A view refresh, the way a recycler window move re-renders the panel. */
  function render(): void {
    const fixture = TestBed.createComponent(RenderTick);
    fixture.componentRef.changeDetectorRef.markForCheck();
    TestBed.tick();
  }

  function rowObserves(): readonly unknown[] {
    return ro.observe.mock.calls.filter(([el]) =>
      (el as Element).hasAttribute('data-cngx-recycle-index'),
    );
  }

  function row(index: number, height: number): HTMLElement {
    const el = document.createElement('div');
    el.setAttribute('data-cngx-recycle-index', String(index));
    el.getBoundingClientRect = () => ({ height }) as DOMRect;
    return el;
  }

  it('keeps one observer on the first row while its own estimate changes', () => {
    const { renderer, handle } = build({
      flatOptions: signal(items(TOTAL)),
      popover: container,
      virtualization: {},
    });
    const first = row(0, 40);
    container.appendChild(first);
    mountRecycler(handle);
    render();
    expect(rowObserves()).toEqual([[first, { box: 'border-box' }]]);
    const windowAt40 = renderer.renderOptions().length;

    // A sizing change (text scale) behind the resize, not new row content.
    first.style.fontSize = '20px';
    ro.triggerResize({ borderBoxSize: [{ blockSize: 50, inlineSize: 0 }] });
    render();
    expect(renderer.renderOptions().length).toBeLessThan(windowAt40);
    expect(rowObserves()).toEqual([[first, { box: 'border-box' }]]);
    expect(ro.disconnect).not.toHaveBeenCalled();
  });

  it('keeps the observer when a different row node comes first', () => {
    const { handle } = build({
      flatOptions: signal(items(TOTAL)),
      popover: container,
      virtualization: {},
    });
    const first = row(0, 40);
    container.appendChild(first);
    mountRecycler(handle);
    render();

    first.remove();
    const next = row(12, 40);
    container.appendChild(next);
    render();
    expect(ro.disconnect).not.toHaveBeenCalled();
    expect(rowObserves()).toEqual([[first, { box: 'border-box' }]]);
  });

  it('probes nothing while the panel is closed and measures again on the next open', () => {
    const open = signal(true);
    const { renderer, handle } = build({
      flatOptions: signal(items(TOTAL)),
      popover: container,
      virtualization: {},
      open,
    });
    const first = row(0, 40);
    container.appendChild(first);
    mountRecycler(handle);
    render();
    const windowAt40 = renderer.renderOptions().length;

    open.set(false);
    render();
    expect(ro.disconnect).toHaveBeenCalledTimes(1);
    first.getBoundingClientRect = () => ({ height: 50 }) as DOMRect;
    render();
    expect(rowObserves()).toEqual([[first, { box: 'border-box' }]]);
    expect(renderer.renderOptions().length).toBe(windowAt40);

    open.set(true);
    render();
    expect(rowObserves()).toEqual([
      [first, { box: 'border-box' }],
      [first, { box: 'border-box' }],
    ]);
    expect(renderer.renderOptions().length).toBeLessThan(windowAt40);
  });

  function windowFor(virtualization: CngxSelectVirtualizationConfig, rows: HTMLElement[] = []) {
    const box = document.createElement('div');
    Object.defineProperty(box, 'clientHeight', { value: 500, configurable: true });
    box.append(...rows);
    document.body.appendChild(box);
    const { renderer, handle } = build({
      flatOptions: signal(items(TOTAL)),
      popover: box,
      virtualization,
    });
    mountRecycler(handle);
    render();
    const length = renderer.renderOptions().length;
    box.remove();
    return length;
  }

  it('sizes the window from a measured 40px row like an explicit 40px estimate', () => {
    expect(windowFor({}, [row(0, 40)])).toBe(windowFor({ estimateSize: 40 }));
    expect(windowFor({ estimateSize: 40 })).not.toBe(windowFor({ estimateSize: 32 }));
  });

  it('observes no row and keeps an explicit estimateSize', () => {
    const length = windowFor({ estimateSize: 40 }, [row(0, 60)]);
    expect(rowObserves()).toEqual([]);
    expect(length).toBe(windowFor({ estimateSize: 40 }));
  });

  it('ignores a row height of 0 and a resize to 0', () => {
    const { renderer, handle } = build({
      flatOptions: signal(items(TOTAL)),
      popover: container,
      virtualization: {},
    });
    container.appendChild(row(0, 0));
    mountRecycler(handle);
    render();
    const fallback = windowFor({ estimateSize: 32 });
    expect(renderer.renderOptions().length).toBe(fallback);

    ro.triggerResize({ borderBoxSize: [{ blockSize: 0, inlineSize: 0 }] });
    render();
    expect(renderer.renderOptions().length).toBe(fallback);
  });

  it('disconnects the row observer when the recycler is destroyed', () => {
    const { handle } = build({
      flatOptions: signal(items(TOTAL)),
      popover: container,
      virtualization: {},
    });
    container.appendChild(row(0, 40));
    mountRecycler(handle);
    render();
    expect(rowObserves()).toHaveLength(1);
    expect(ro.disconnect).not.toHaveBeenCalled();

    // One for the recycler's scroll element, one for the measured row.
    TestBed.resetTestingModule();
    expect(ro.disconnect).toHaveBeenCalledTimes(2);
  });
});
