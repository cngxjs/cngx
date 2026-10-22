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

function key(name: 'PageDown' | 'PageUp'): KeyboardEvent {
  return new KeyboardEvent('keydown', { key: name, cancelable: true });
}

describe('handlePageJumpKey - virtual panel', () => {
  it('jumps from the absolute active index, not the rendered-window index', () => {
    const { listbox, highlightByIndex } = fakeVirtualListbox(15, 21);
    const ctx = { listbox, popover, flatOptions: () => FLAT };
    handlePageJumpKey(key('PageDown'), ctx);
    expect(highlightByIndex).toHaveBeenCalledExactlyOnceWith(31);
  });

  it('jumps back from the end of the list in absolute space', () => {
    const { listbox, highlightByIndex } = fakeVirtualListbox(TOTAL - WINDOW, TOTAL - 1);
    const ctx = { listbox, popover, flatOptions: () => FLAT };
    handlePageJumpKey(key('PageUp'), ctx);
    expect(highlightByIndex).toHaveBeenCalledExactlyOnceWith(TOTAL - 11);
  });

  it('keeps the rendered options as the index space without virtualisation', () => {
    const { listbox, highlightByIndex } = fakeRenderedListbox(30, 3);
    const ctx = { listbox, popover, flatOptions: () => FLAT };
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
