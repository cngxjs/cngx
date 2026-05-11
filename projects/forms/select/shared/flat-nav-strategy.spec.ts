import { signal, type Signal } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createDefaultFlatNavStrategy,
  type CngxFlatNavContext,
  type CngxFlatNavListboxItem,
  type CngxFlatNavStrategy,
} from './flat-nav-strategy';
import type { CngxSelectOptionDef } from './option.model';
import { cngxSelectDefaultCompare } from './select-core';
import {
  createTypeaheadController,
  type TypeaheadController,
} from './typeahead-controller';

function opt(
  value: string,
  label = value,
  disabled = false,
): CngxSelectOptionDef<string> {
  return { value, label, disabled };
}

interface TestItem extends CngxFlatNavListboxItem {
  readonly id: string;
  readonly label: string;
}

function adItem(
  id: string,
  label: string,
  disabled = false,
): TestItem {
  return { id, label, disabled };
}

function makeController(
  opts: readonly CngxSelectOptionDef<string>[],
): TypeaheadController<string> {
  return createTypeaheadController<string>({
    options: signal(opts),
    compareWith: signal(cngxSelectDefaultCompare) as Signal<
      typeof cngxSelectDefaultCompare
    >,
    debounceMs: signal(200),
    disabled: signal(false),
  });
}

function makeContext(
  overrides: Partial<CngxFlatNavContext<string>> = {},
): CngxFlatNavContext<string> {
  const options: readonly CngxSelectOptionDef<string>[] = [
    opt('Apple'),
    opt('Banana'),
    opt('Cherry'),
    opt('Durian'),
    opt('Elderberry'),
    opt('Fig'),
    opt('Grape'),
    opt('Honeydew'),
    opt('Iced-plum'),
    opt('Jackfruit'),
    opt('Kiwi'),
    opt('Lime'),
    opt('Mango'),
  ];
  const listboxItems: readonly TestItem[] = options.map((o, i) =>
    adItem(`opt-${i}`, o.label, o.disabled),
  );
  return {
    options,
    listboxItems,
    currentFlatIndex: -1,
    currentListboxIndex: -1,
    compareWith: (a, b) => a === b,
    disabled: false,
    typeaheadController: makeController(options),
    ...overrides,
  };
}

describe('createDefaultFlatNavStrategy', () => {
  let strategy: CngxFlatNavStrategy;

  beforeEach(() => {
    vi.useFakeTimers();
    strategy = createDefaultFlatNavStrategy();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('onPageJump', () => {
    it('jumps +10 from index 0 on PageDown (default pageStep)', () => {
      const ctx = makeContext({ currentListboxIndex: 0 });
      const result = strategy.onPageJump(ctx, 1);
      expect(result).toEqual({ kind: 'highlight', index: 10 });
    });

    it('jumps -10 from index 12 on PageUp', () => {
      const ctx = makeContext({ currentListboxIndex: 12 });
      const result = strategy.onPageJump(ctx, -1);
      expect(result).toEqual({ kind: 'highlight', index: 2 });
    });

    it('clamps to the last index when PageDown overshoots', () => {
      // 13 items, currentIndex=5, +10 = 15 → clamped to 12
      const ctx = makeContext({ currentListboxIndex: 5 });
      const result = strategy.onPageJump(ctx, 1);
      expect(result).toEqual({ kind: 'highlight', index: 12 });
    });

    it('clamps to index 0 when PageUp undershoots', () => {
      const ctx = makeContext({ currentListboxIndex: 3 });
      const result = strategy.onPageJump(ctx, -1);
      expect(result).toEqual({ kind: 'highlight', index: 0 });
    });

    it('treats currentListboxIndex=-1 as "start at 0"', () => {
      const ctx = makeContext({ currentListboxIndex: -1 });
      const result = strategy.onPageJump(ctx, 1);
      expect(result).toEqual({ kind: 'highlight', index: 10 });
    });

    it('returns noop when disabled=true', () => {
      const ctx = makeContext({ currentListboxIndex: 0, disabled: true });
      const result = strategy.onPageJump(ctx, 1);
      expect(result).toEqual({ kind: 'noop' });
    });

    it('returns noop when listbox is empty', () => {
      const ctx = makeContext({ listboxItems: [], options: [] });
      const result = strategy.onPageJump(ctx, 1);
      expect(result).toEqual({ kind: 'noop' });
    });

    it('skips forward past a disabled target to the next enabled one', () => {
      // Mark index 10 disabled; PageDown from 0 targets index 10 first,
      // then scans forward to index 11 (next enabled).
      const items = [
        adItem('i-0', 'A'),
        adItem('i-1', 'B'),
        adItem('i-2', 'C'),
        adItem('i-3', 'D'),
        adItem('i-4', 'E'),
        adItem('i-5', 'F'),
        adItem('i-6', 'G'),
        adItem('i-7', 'H'),
        adItem('i-8', 'I'),
        adItem('i-9', 'J'),
        adItem('i-10', 'K', true),
        adItem('i-11', 'L'),
        adItem('i-12', 'M'),
      ];
      const ctx = makeContext({
        currentListboxIndex: 0,
        listboxItems: items,
      });
      const result = strategy.onPageJump(ctx, 1);
      expect(result).toEqual({ kind: 'highlight', index: 11 });
    });

    it('back-probes when forward-scan hits the list boundary on a disabled item', () => {
      // All trailing items disabled; PageDown from 0 targets 10 (disabled),
      // scan forward stops at 12 (still disabled, end-of-list), then
      // back-probe to 9 (enabled).
      const items = [
        adItem('i-0', 'A'),
        adItem('i-1', 'B'),
        adItem('i-2', 'C'),
        adItem('i-3', 'D'),
        adItem('i-4', 'E'),
        adItem('i-5', 'F'),
        adItem('i-6', 'G'),
        adItem('i-7', 'H'),
        adItem('i-8', 'I'),
        adItem('i-9', 'J'),
        adItem('i-10', 'K', true),
        adItem('i-11', 'L', true),
        adItem('i-12', 'M', true),
      ];
      const ctx = makeContext({
        currentListboxIndex: 0,
        listboxItems: items,
      });
      const result = strategy.onPageJump(ctx, 1);
      expect(result).toEqual({ kind: 'highlight', index: 9 });
    });
  });

  describe('onPageJump — custom pageStep', () => {
    it('respects a custom pageStep override', () => {
      const s = createDefaultFlatNavStrategy({ pageStep: 3 });
      const ctx = makeContext({ currentListboxIndex: 0 });
      const result = s.onPageJump(ctx, 1);
      expect(result).toEqual({ kind: 'highlight', index: 3 });
    });
  });

  describe('onTypeaheadWhileClosed', () => {
    it("returns a 'select' action for the first matching option (currentFlatIndex=-1)", () => {
      const ctx = makeContext({ currentFlatIndex: -1 });
      const result = strategy.onTypeaheadWhileClosed(ctx, 'b');
      expect(result).toEqual({ kind: 'select', option: opt('Banana') });
    });

    it('advances round-robin when currentFlatIndex points to a match', () => {
      // Controller buffer empty + matchFromIndex('a', 0) walks EXCLUSIVE
      // of index 0 (Apple). With only one 'a' option, buffer becomes 'a'
      // and we wrap to Apple.
      const ctx = makeContext({ currentFlatIndex: 0 });
      const result = strategy.onTypeaheadWhileClosed(ctx, 'a');
      expect(result).toEqual({ kind: 'select', option: opt('Apple') });
    });

    it('returns noop for non-printable chars', () => {
      const ctx = makeContext({ currentFlatIndex: -1 });
      const result = strategy.onTypeaheadWhileClosed(ctx, 'Enter');
      expect(result).toEqual({ kind: 'noop' });
    });

    it('returns noop for whitespace', () => {
      const ctx = makeContext({ currentFlatIndex: -1 });
      const result = strategy.onTypeaheadWhileClosed(ctx, ' ');
      expect(result).toEqual({ kind: 'noop' });
    });

    it('returns noop when no option matches the buffer', () => {
      const ctx = makeContext({ currentFlatIndex: -1 });
      const result = strategy.onTypeaheadWhileClosed(ctx, 'z');
      expect(result).toEqual({ kind: 'noop' });
    });

    it('returns noop when disabled=true (strategy short-circuit BEFORE controller)', () => {
      const ctx = makeContext({
        currentFlatIndex: -1,
        disabled: true,
      });
      const result = strategy.onTypeaheadWhileClosed(ctx, 'b');
      expect(result).toEqual({ kind: 'noop' });
    });

    it('accumulates buffer across calls (multi-char typeahead)', () => {
      const ctx = makeContext({ currentFlatIndex: -1 });
      const first = strategy.onTypeaheadWhileClosed(ctx, 'b');
      expect(first).toEqual({ kind: 'select', option: opt('Banana') });
      // Buffer is now 'b'; next 'a' makes 'ba' which still matches Banana.
      const second = strategy.onTypeaheadWhileClosed(ctx, 'a');
      expect(second).toEqual({ kind: 'select', option: opt('Banana') });
      // After debounce, buffer resets; 'c' matches Cherry.
      vi.advanceTimersByTime(300);
      const third = strategy.onTypeaheadWhileClosed(ctx, 'c');
      expect(third).toEqual({ kind: 'select', option: opt('Cherry') });
    });
  });
});
