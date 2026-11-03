import { signal } from '@angular/core';
import type { CngxListbox } from '@cngx/common/interactive';
import type { CngxPopover } from '@cngx/common/popover';
import { describe, expect, it, vi } from 'vitest';

import { createDefaultFlatNavStrategy } from '../flat-nav-strategy';
import type { CngxSelectOptionDef } from '../option.model';
import { createTypeaheadController } from '../typeahead-controller';
import { cngxSelectDefaultCompare } from './select-core';
import { handleFlatNavPageJumpKey, handlePageJumpKey } from './page-jump-handler';

const TOTAL = 10000;
const WINDOW = 20;

const FLAT: CngxSelectOptionDef<number>[] = Array.from({ length: TOTAL }, (_, i) => ({
  value: i,
  label: `Option ${i}`,
  disabled: false,
}));

interface FakeListbox {
  readonly listbox: CngxListbox<unknown>;
  readonly highlightByIndex: ReturnType<typeof vi.fn>;
}

/** A virtual listbox rendering `WINDOW` items from `windowStart`, active at an absolute index. */
function fakeVirtualListbox(windowStart: number, activeIndex: number): FakeListbox {
  const rendered = FLAT.slice(windowStart, windowStart + WINDOW).map((o) => ({
    id: `opt-${o.value}`,
    disabled: false,
  }));
  const highlightByIndex = vi.fn();
  const listbox = {
    options: () => rendered,
    ad: {
      virtualCount: () => TOTAL,
      windowStart: () => windowStart,
      activeIndex: () => activeIndex,
      activeId: () => `opt-${activeIndex}`,
      highlightByIndex,
    },
  } as unknown as CngxListbox<unknown>;
  return { listbox, highlightByIndex };
}

/** A non-virtual listbox: every option rendered, AD index = rendered index. */
function fakeRenderedListbox(count: number, activeIndex: number): FakeListbox {
  const rendered = FLAT.slice(0, count).map((o) => ({ id: `opt-${o.value}`, disabled: false }));
  const highlightByIndex = vi.fn();
  const listbox = {
    options: () => rendered,
    ad: {
      virtualCount: () => undefined,
      windowStart: () => 0,
      activeIndex: () => activeIndex,
      activeId: () => `opt-${activeIndex}`,
      highlightByIndex,
    },
  } as unknown as CngxListbox<unknown>;
  return { listbox, highlightByIndex };
}

const popover = { isVisible: () => true, show: vi.fn() } as unknown as CngxPopover;

const STRATEGY_DEPS = {
  strategy: createDefaultFlatNavStrategy(),
  flatOptions: () => FLAT,
  compareWith: () => cngxSelectDefaultCompare,
};

function key(name: 'PageDown' | 'PageUp'): KeyboardEvent {
  return new KeyboardEvent('keydown', { key: name, cancelable: true });
}

describe('handlePageJumpKey - virtual panel', () => {
  it('jumps from the absolute active index, not the rendered-window index', () => {
    const { listbox, highlightByIndex } = fakeVirtualListbox(15, 21);
    const ctx = { listbox, popover, ...STRATEGY_DEPS };
    handlePageJumpKey(key('PageDown'), ctx);
    expect(highlightByIndex).toHaveBeenCalledExactlyOnceWith(31);
  });

  it('jumps back from the end of the list in absolute space', () => {
    const { listbox, highlightByIndex } = fakeVirtualListbox(TOTAL - WINDOW, TOTAL - 1);
    const ctx = { listbox, popover, ...STRATEGY_DEPS };
    handlePageJumpKey(key('PageUp'), ctx);
    expect(highlightByIndex).toHaveBeenCalledExactlyOnceWith(TOTAL - 11);
  });

  it('keeps the rendered options as the index space without virtualisation', () => {
    const { listbox, highlightByIndex } = fakeRenderedListbox(30, 3);
    const ctx = { listbox, popover, ...STRATEGY_DEPS };
    handlePageJumpKey(key('PageDown'), ctx);
    expect(highlightByIndex).toHaveBeenCalledExactlyOnceWith(13);
  });
});

describe('handleFlatNavPageJumpKey - virtual panel', () => {
  function deps(listbox: CngxListbox<unknown>) {
    return {
      listbox,
      popover,
      strategy: createDefaultFlatNavStrategy(),
      flatOptions: () => FLAT,
      compareWith: () => cngxSelectDefaultCompare,
      disabled: () => false,
      typeaheadController: createTypeaheadController<number>({
        options: signal(FLAT),
        compareWith: signal(cngxSelectDefaultCompare),
        debounceMs: signal(200),
        disabled: signal(false),
      }),
    };
  }

  it('hands the strategy the absolute active index and the full list', () => {
    const { listbox, highlightByIndex } = fakeVirtualListbox(15, 21);
    handleFlatNavPageJumpKey(key('PageDown'), deps(listbox));
    expect(highlightByIndex).toHaveBeenCalledExactlyOnceWith(31);
  });

  it('jumps back from the end of the list in absolute space', () => {
    const { listbox, highlightByIndex } = fakeVirtualListbox(TOTAL - WINDOW, TOTAL - 1);
    handleFlatNavPageJumpKey(key('PageUp'), deps(listbox));
    expect(highlightByIndex).toHaveBeenCalledExactlyOnceWith(TOTAL - 11);
  });
});

describe('page jump on a disabled control', () => {
  function closedPopover(): { popover: CngxPopover; show: ReturnType<typeof vi.fn> } {
    const show = vi.fn();
    return { popover: { isVisible: () => false, show } as unknown as CngxPopover, show };
  }

  it('handlePageJumpKey leaves the key alone and keeps the panel shut', () => {
    const { listbox, highlightByIndex } = fakeRenderedListbox(30, 3);
    const { popover: closed, show } = closedPopover();
    const event = key('PageDown');
    const handled = handlePageJumpKey(event, {
      listbox,
      popover: closed,
      ...STRATEGY_DEPS,
      disabled: () => true,
    });
    expect(handled).toBe(false);
    expect(event.defaultPrevented).toBe(false);
    expect(show).not.toHaveBeenCalled();
    expect(highlightByIndex).not.toHaveBeenCalled();
  });

  it('handleFlatNavPageJumpKey leaves the key alone and keeps the panel shut', () => {
    const { listbox, highlightByIndex } = fakeRenderedListbox(30, 3);
    const { popover: closed, show } = closedPopover();
    const event = key('PageUp');
    const handled = handleFlatNavPageJumpKey(event, {
      listbox,
      popover: closed,
      strategy: createDefaultFlatNavStrategy(),
      flatOptions: () => FLAT,
      compareWith: () => cngxSelectDefaultCompare,
      disabled: () => true,
      typeaheadController: createTypeaheadController<number>({
        options: signal(FLAT),
        compareWith: signal(cngxSelectDefaultCompare),
        debounceMs: signal(200),
        disabled: signal(true),
      }),
    });
    expect(handled).toBe(false);
    expect(event.defaultPrevented).toBe(false);
    expect(show).not.toHaveBeenCalled();
    expect(highlightByIndex).not.toHaveBeenCalled();
  });

  it('handleFlatNavPageJumpKey opens a closed panel when enabled', () => {
    const { listbox } = fakeRenderedListbox(30, 3);
    const { popover: closed, show } = closedPopover();
    handleFlatNavPageJumpKey(key('PageDown'), {
      listbox,
      popover: closed,
      strategy: createDefaultFlatNavStrategy(),
      flatOptions: () => FLAT,
      compareWith: () => cngxSelectDefaultCompare,
      disabled: () => false,
      typeaheadController: createTypeaheadController<number>({
        options: signal(FLAT),
        compareWith: signal(cngxSelectDefaultCompare),
        debounceMs: signal(200),
        disabled: signal(false),
      }),
    });
    expect(show).toHaveBeenCalledTimes(1);
  });
});

describe('handleFlatNavPageJumpKey - virtualSpace', () => {
  const controller = () =>
    createTypeaheadController<number>({
      options: signal(FLAT),
      compareWith: signal(cngxSelectDefaultCompare),
      debounceMs: signal(200),
      disabled: signal(false),
    });

  it('resolves the jump in virtualSpace and hands the strategy flatOptions', () => {
    const { listbox } = fakeVirtualListbox(0, 3);
    const visible = FLAT.slice(0, 50);
    const strategy = createDefaultFlatNavStrategy();
    const onPageJump = vi.spyOn(strategy, 'onPageJump');
    handleFlatNavPageJumpKey(key('PageDown'), {
      listbox,
      popover,
      strategy,
      flatOptions: () => FLAT,
      virtualSpace: () => visible,
      compareWith: () => cngxSelectDefaultCompare,
      disabled: () => false,
      typeaheadController: controller(),
    });
    const [ctx] = onPageJump.mock.calls[0];
    expect(ctx.listboxItems).toBe(visible);
    expect(ctx.options).toBe(FLAT);
    expect(ctx.currentListboxIndex).toBe(3);
  });

  it('passes Ctrl+PageDown through untouched', () => {
    const { listbox, highlightByIndex } = fakeRenderedListbox(30, 3);
    const event = new KeyboardEvent('keydown', { key: 'PageDown', ctrlKey: true, cancelable: true });
    const handled = handleFlatNavPageJumpKey(event, {
      listbox,
      popover,
      strategy: createDefaultFlatNavStrategy(),
      flatOptions: () => FLAT,
      compareWith: () => cngxSelectDefaultCompare,
      disabled: () => false,
      typeaheadController: controller(),
    });
    expect(handled).toBe(false);
    expect(event.defaultPrevented).toBe(false);
    expect(highlightByIndex).not.toHaveBeenCalled();
  });
});

describe('handlePageJumpKey - strategy routing', () => {
  it('jumps by the page step of the injected strategy', () => {
    const { listbox, highlightByIndex } = fakeRenderedListbox(30, 3);
    handlePageJumpKey(key('PageDown'), {
      listbox,
      popover,
      ...STRATEGY_DEPS,
      strategy: createDefaultFlatNavStrategy({ pageStep: 5 }),
    });
    expect(highlightByIndex).toHaveBeenCalledExactlyOnceWith(8);
  });

  it('keeps the key handled and highlights nothing when the strategy returns noop', () => {
    const { listbox, highlightByIndex } = fakeRenderedListbox(30, 3);
    const event = key('PageDown');
    const handled = handlePageJumpKey(event, {
      listbox,
      popover,
      ...STRATEGY_DEPS,
      strategy: { ...createDefaultFlatNavStrategy(), onPageJump: () => ({ kind: 'noop' }) },
    });
    expect(handled).toBe(true);
    expect(event.defaultPrevented).toBe(true);
    expect(highlightByIndex).not.toHaveBeenCalled();
  });
});
