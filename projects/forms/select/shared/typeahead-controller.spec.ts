import { signal, type Signal } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createTypeaheadController,
  resolvePageJumpTarget,
  type TypeaheadController,
} from './typeahead-controller';
import type { CngxSelectOptionDef } from './option.model';
import { cngxSelectDefaultCompare } from './select-core';

// ── Helpers ────────────────────────────────────────────────────────────

function opt(label: string, disabled = false): CngxSelectOptionDef<string> {
  return { value: label, label, disabled };
}

interface ControllerHarness {
  readonly controller: TypeaheadController<string>;
  readonly options: ReturnType<typeof signal<readonly CngxSelectOptionDef<string>[]>>;
  readonly debounceMs: ReturnType<typeof signal<number>>;
  readonly disabled: ReturnType<typeof signal<boolean>>;
}

function makeController(
  initialOptions: readonly CngxSelectOptionDef<string>[],
  debounce = 200,
): ControllerHarness {
  const options = signal<readonly CngxSelectOptionDef<string>[]>(initialOptions);
  const debounceMs = signal(debounce);
  const disabled = signal(false);
  const controller = createTypeaheadController<string>({
    options,
    compareWith: signal(cngxSelectDefaultCompare) as Signal<typeof cngxSelectDefaultCompare>,
    debounceMs,
    disabled,
  });
  return { controller, options, debounceMs, disabled };
}

// ── TypeaheadController tests ──────────────────────────────────────────

describe('createTypeaheadController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('with no current (currentIndex -1) matches the first option from index 0', () => {
    const { controller } = makeController([opt('Apple'), opt('Banana'), opt('Blueberry')]);
    expect(controller.matchFromIndex('a', -1)).toEqual(opt('Apple'));
    vi.advanceTimersByTime(300);
    expect(controller.matchFromIndex('b', -1)).toEqual(opt('Banana'));
  });

  it('with a current option, walks EXCLUSIVE of currentIndex so repeat taps advance', () => {
    const { controller } = makeController([opt('Bravo'), opt('Banana'), opt('Blueberry')]);
    // currentIndex 0 = Bravo highlighted; 'b' advances to Banana.
    expect(controller.matchFromIndex('b', 0)).toEqual(opt('Banana'));
    vi.advanceTimersByTime(300);
    // currentIndex 1 = Banana highlighted; 'b' advances to Blueberry.
    expect(controller.matchFromIndex('b', 1)).toEqual(opt('Blueberry'));
    vi.advanceTimersByTime(300);
    // currentIndex 2 = Blueberry highlighted; 'b' wraps back to Bravo.
    expect(controller.matchFromIndex('b', 2)).toEqual(opt('Bravo'));
  });

  it('wraps the round-robin from a currentIndex near the end back to the start', () => {
    const { controller } = makeController([opt('Alpha'), opt('Bravo'), opt('Charlie'), opt('Alabama')]);
    // currentIndex 3 = Alabama highlighted; 'a' wraps → first 'a' after it = Alpha.
    expect(controller.matchFromIndex('a', 3)).toEqual(opt('Alpha'));
  });

  it('skips disabled options', () => {
    const { controller } = makeController([opt('Apple', true), opt('Avocado'), opt('Apricot')]);
    expect(controller.matchFromIndex('a', -1)).toEqual(opt('Avocado'));
  });

  it('accumulates the buffer across fast calls for multi-char resolve', () => {
    const { controller } = makeController([opt('Sand'), opt('Salt'), opt('Salmon')]);
    // No current selection — walk inclusively from 0. 's' → Sand.
    expect(controller.matchFromIndex('s', -1)).toEqual(opt('Sand'));
    // Still no current; buffer 'sa' — all three qualify, first is Sand.
    expect(controller.matchFromIndex('a', -1)).toEqual(opt('Sand'));
    // Buffer 'sal' — only Salt + Salmon qualify; first is Salt.
    expect(controller.matchFromIndex('l', -1)).toEqual(opt('Salt'));
  });

  it('resets the buffer after debounceMs and reverts to single-char jump', () => {
    const { controller } = makeController([opt('Sand'), opt('Salt')], 200);
    controller.matchFromIndex('s', -1);
    controller.matchFromIndex('a', -1);
    vi.advanceTimersByTime(250);
    // Buffer has reset — a fresh 's' should match Sand again, not stay locked on 'sas...'.
    expect(controller.matchFromIndex('s', -1)).toEqual(opt('Sand'));
  });

  it('clearBuffer is immediate and idempotent', () => {
    const { controller } = makeController([opt('Sand'), opt('Salt')]);
    controller.matchFromIndex('s', -1);
    controller.matchFromIndex('a', -1);
    expect(controller.buffer()).toBe('sa');
    controller.clearBuffer();
    expect(controller.buffer()).toBe('');
    expect(() => controller.clearBuffer()).not.toThrow();
    expect(controller.buffer()).toBe('');
  });

  it('returns null for non-printable chars', () => {
    const { controller } = makeController([opt('A'), opt('B')]);
    expect(controller.matchFromIndex('Shift', -1)).toBeNull();
    expect(controller.matchFromIndex(' ', -1)).toBeNull();
    expect(controller.matchFromIndex('', -1)).toBeNull();
  });

  it('returns null when the controller is disabled', () => {
    const { controller, disabled } = makeController([opt('A'), opt('B')]);
    disabled.set(true);
    expect(controller.matchFromIndex('a', -1)).toBeNull();
  });

  it('returns null when there are no options', () => {
    const { controller } = makeController([]);
    expect(controller.matchFromIndex('a', -1)).toBeNull();
  });

  it('exposes the current buffer as a readonly signal', () => {
    const { controller } = makeController([opt('A')]);
    expect(controller.buffer()).toBe('');
    controller.matchFromIndex('a', -1);
    expect(controller.buffer()).toBe('a');
  });

  it('picks up option-list changes without needing a controller reset', () => {
    const { controller, options } = makeController([opt('A')]);
    vi.advanceTimersByTime(300); // ensure buffer starts clean
    options.set([opt('Zoo'), opt('Zebra')]);
    expect(controller.matchFromIndex('z', -1)).toEqual(opt('Zoo'));
  });
});

// ── resolvePageJumpTarget tests ────────────────────────────────────────

describe('resolvePageJumpTarget', () => {
  interface Opt {
    readonly id: number;
    readonly disabled?: boolean;
  }
  const isDisabled = (o: Opt): boolean => o.disabled === true;

  it('returns null on empty option list', () => {
    expect(resolvePageJumpTarget<Opt>([], 0, 1, isDisabled)).toBeNull();
  });

  it('jumps forward by the default step 10 and clamps to the last index', () => {
    const opts = Array.from({ length: 15 }, (_, i) => ({ id: i } as Opt));
    expect(resolvePageJumpTarget(opts, 0, 1, isDisabled)).toBe(10);
    expect(resolvePageJumpTarget(opts, 8, 1, isDisabled)).toBe(14);
  });

  it('jumps backward by 10 and clamps to 0', () => {
    const opts = Array.from({ length: 15 }, (_, i) => ({ id: i } as Opt));
    expect(resolvePageJumpTarget(opts, 14, -1, isDisabled)).toBe(4);
    expect(resolvePageJumpTarget(opts, 5, -1, isDisabled)).toBe(0);
  });

  it('honours a custom step', () => {
    const opts = Array.from({ length: 20 }, (_, i) => ({ id: i } as Opt));
    expect(resolvePageJumpTarget(opts, 0, 1, isDisabled, 5)).toBe(5);
  });

  it('skips past a disabled target in the chosen direction', () => {
    const opts: Opt[] = [
      ...Array.from({ length: 10 }, (_, i) => ({ id: i })),
      { id: 10, disabled: true },
      { id: 11 },
    ];
    // Target lands on id=10 (disabled) → step forward to id=11.
    expect(resolvePageJumpTarget(opts, 0, 1, isDisabled)).toBe(11);
  });

  it('back-probes the opposite direction when the target cluster is disabled', () => {
    // Forward jump lands on a disabled cluster at the end → back-probe.
    const opts: Opt[] = [
      { id: 0 },
      ...Array.from({ length: 9 }, (_, i) => ({ id: i + 1, disabled: true })),
      { id: 10, disabled: true },
    ];
    expect(resolvePageJumpTarget(opts, 0, 1, isDisabled)).toBe(0);
  });

  it('returns null when every option is disabled', () => {
    const opts = Array.from({ length: 5 }, (_, i) => ({ id: i, disabled: true } as Opt));
    expect(resolvePageJumpTarget(opts, 0, 1, isDisabled)).toBeNull();
  });
});
