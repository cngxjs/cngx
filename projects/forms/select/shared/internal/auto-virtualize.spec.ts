import { signal, type Signal } from '@angular/core';
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
}): { renderer: PanelRenderer<number>; handle: CngxSelectAutoRecyclerHandle } {
  const { renderer, autoRecycler } = createAutoPanelRenderer<number>({
    flatOptions: opts.flatOptions,
    hasGroup: opts.hasGroup ?? signal(false),
    popoverRef: signal<CngxPopover | undefined>({
      elementRef: { nativeElement: opts.popover },
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

  it('keeps the 32px default when estimateSize is unset', () => {
    const renderer = makeRenderer({});
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
